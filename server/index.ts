// Servidor do jogo da velha: arquivos do site (dist/) e salas online pelo WebSocket em /ws.
// Uso: PORT=4701 node server/index.ts  (Node 22.18+ executa TypeScript direto)
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import { createStaticServer } from "./static.ts";
import { canPlay, emptyBoard, isOver, other, outcome, play, turnOf, type Board, type Mark } from "../src/game.ts";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  MAX_NAME,
  normalizeCode,
  type ClientMessage,
  type RoomView,
  type ServerMessage,
} from "../src/protocol.ts";

const PORT = Number(process.env.PORT ?? 4701);
const HOST = process.env.HOST ?? "127.0.0.1";
const DIST = process.env.DIST ?? fileURLToPath(new URL("../dist", import.meta.url));
const ROOM_TTL = 30 * 60_000; // sala sem ninguém conectado some depois de 30 min
const SESSION_TTL = 2 * 60 * 60_000;

interface Session {
  id: string;
  name: string;
  sockets: Set<WebSocket>;
  room: string | null;
  lastSeen: number;
}

interface Room {
  code: string;
  board: Board;
  starter: Mark;
  seats: Partial<Record<Mark, string>>;
  spectators: Set<string>;
  score: { X: number; O: number; draws: number };
  rematch: Set<Mark>;
  lastActive: number;
}

const sessions = new Map<string, Session>();
const rooms = new Map<string, Room>();

// ---------- Salas ----------

function newCode(): string {
  for (;;) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    if (!rooms.has(code)) return code;
  }
}

const markOf = (room: Room, session: string): Mark | null =>
  room.seats.X === session ? "X" : room.seats.O === session ? "O" : null;

function view(room: Room, session: string): RoomView {
  const players = (["X", "O"] as Mark[]).flatMap((mark) => {
    const id = room.seats[mark];
    const s = id ? sessions.get(id) : undefined;
    return s ? [{ name: s.name, mark, online: s.sockets.size > 0, rematch: room.rematch.has(mark) }] : [];
  });
  const spectators = [...room.spectators].filter((id) => (sessions.get(id)?.sockets.size ?? 0) > 0).length;
  return { code: room.code, board: room.board, starter: room.starter, players, spectators, score: room.score, you: markOf(room, session) };
}

function participants(room: Room): string[] {
  return [room.seats.X, room.seats.O, ...room.spectators].filter((id): id is string => Boolean(id));
}

function broadcast(room: Room) {
  room.lastActive = Date.now();
  for (const id of participants(room)) {
    const session = sessions.get(id);
    if (session) sendTo(session, { type: "room", room: view(room, id) });
  }
}

function leaveRoom(session: Session) {
  const room = session.room ? rooms.get(session.room) : undefined;
  session.room = null;
  if (!room) return;
  const mark = markOf(room, session.id);
  if (mark) {
    delete room.seats[mark];
    room.rematch.clear();
    // Partida abandonada no meio não conta; o placar continua.
    if (!isOver(room.board)) room.board = emptyBoard();
  }
  room.spectators.delete(session.id);
  broadcast(room);
}

function joinRoom(session: Session, room: Room) {
  if (session.room !== room.code) leaveRoom(session);
  session.room = room.code;
  if (!markOf(room, session.id)) {
    const free = (["X", "O"] as Mark[]).find((m) => !room.seats[m]);
    if (free) {
      room.seats[free] = session.id;
      room.spectators.delete(session.id);
    } else room.spectators.add(session.id);
  }
  broadcast(room);
}

// ---------- Mensagens ----------

function sendTo(session: Session, message: ServerMessage) {
  for (const socket of session.sockets) send(socket, message);
}

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

const cleanName = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_NAME) || "Jogador" : "Jogador";

function handle(socket: WebSocket, state: { session: Session | null }, message: ClientMessage) {
  if (message.type === "hello") {
    if (typeof message.session !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(message.session)) {
      return send(socket, { type: "error", code: "badSession" });
    }
    const session = sessions.get(message.session) ?? { id: message.session, name: "", sockets: new Set(), room: null, lastSeen: Date.now() };
    sessions.set(session.id, session);
    session.name = cleanName(message.name);
    session.sockets.add(socket);
    state.session = session;
    send(socket, { type: "ready" });
    const room = session.room ? rooms.get(session.room) : undefined;
    if (room) broadcast(room);
    return;
  }

  const session = state.session;
  if (!session) return send(socket, { type: "error", code: "notReady" });
  const room = session.room ? rooms.get(session.room) : undefined;

  switch (message.type) {
    case "create": {
      const created: Room = {
        code: newCode(),
        board: emptyBoard(),
        starter: "X",
        seats: {},
        spectators: new Set(),
        score: { X: 0, O: 0, draws: 0 },
        rematch: new Set(),
        lastActive: Date.now(),
      };
      rooms.set(created.code, created);
      return joinRoom(session, created);
    }
    case "join": {
      const target = rooms.get(normalizeCode(String(message.code ?? "")));
      if (!target) return send(socket, { type: "error", code: "roomNotFound" });
      return joinRoom(session, target);
    }
    case "move": {
      if (!room) return;
      const mark = markOf(room, session.id);
      if (!mark || !room.seats.X || !room.seats.O) return;
      if (turnOf(room.board, room.starter) !== mark || !canPlay(room.board, message.index)) return;
      room.board = play(room.board, message.index, mark);
      const result = outcome(room.board);
      if (result.winner) room.score[result.winner]++;
      else if (result.draw) room.score.draws++;
      return broadcast(room);
    }
    case "rematch": {
      if (!room || !isOver(room.board)) return;
      const mark = markOf(room, session.id);
      if (!mark) return;
      room.rematch.add(mark);
      if (room.seats.X && room.seats.O && room.rematch.size === 2) {
        room.board = emptyBoard();
        room.starter = other(room.starter);
        room.rematch.clear();
      }
      return broadcast(room);
    }
    case "leave": {
      leaveRoom(session);
      return send(socket, { type: "left" });
    }
  }
}

// ---------- Servidor ----------

const http = createStaticServer(DIST);
const wss = new WebSocketServer({ server: http, path: "/ws", maxPayload: 2048 });

wss.on("connection", (socket) => {
  const state: { session: Session | null } = { session: null };
  let alive = true;
  socket.on("pong", () => (alive = true));
  const heartbeat = setInterval(() => {
    if (!alive) return socket.terminate();
    alive = false;
    socket.ping();
  }, 30_000);

  socket.on("message", (data) => {
    let message: ClientMessage;
    try {
      message = JSON.parse(String(data));
    } catch {
      return;
    }
    if (message && typeof message === "object" && typeof message.type === "string") handle(socket, state, message);
  });

  socket.on("close", () => {
    clearInterval(heartbeat);
    const session = state.session;
    if (!session) return;
    session.sockets.delete(socket);
    session.lastSeen = Date.now();
    const room = session.room ? rooms.get(session.room) : undefined;
    if (room) broadcast(room);
  });
});

// Limpeza de salas e sessões abandonadas.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    const anyoneOnline = participants(room).some((id) => (sessions.get(id)?.sockets.size ?? 0) > 0);
    if (!anyoneOnline && now - room.lastActive > ROOM_TTL) rooms.delete(code);
  }
  for (const [id, session] of sessions) {
    if (session.sockets.size === 0 && now - session.lastSeen > SESSION_TTL) {
      if (session.room) leaveRoom(session);
      sessions.delete(id);
    }
  }
}, 60_000).unref();

http.listen(PORT, HOST, () => console.log(`tictactoe: http://${HOST}:${PORT} (salas em /ws)`));
