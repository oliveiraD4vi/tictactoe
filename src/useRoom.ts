import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ErrorCode, RoomView, ServerMessage } from "./protocol";
import { sessionId } from "./session";

export type Status = "connecting" | "open" | "reconnecting";

interface Options {
  name: string;
  /** O que fazer quando a conexão abre pela primeira vez: criar ou entrar numa sala. */
  initial: ClientMessage;
  onLeft: () => void;
}

/** Conexão com o servidor de salas, com reconexão automática. */
export function useRoom({ name, initial, onLeft }: Options) {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<ErrorCode | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const started = useRef(false);
  const code = useRef<string | null>(null);
  const leaving = useRef(false);
  const onLeftRef = useRef(onLeft);
  onLeftRef.current = onLeft;

  useEffect(() => {
    let attempt = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    function connect() {
      const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
      socket.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setStatus("open");
        ws.send(JSON.stringify({ type: "hello", session: sessionId(), name } satisfies ClientMessage));
      };
      ws.onmessage = (event) => {
        const message: ServerMessage = JSON.parse(event.data);
        if (message.type === "ready") {
          // Na primeira vez cria ou entra; ao reconectar, volta para a mesma sala pelo código.
          if (!started.current) ws.send(JSON.stringify(initial));
          else if (code.current) ws.send(JSON.stringify({ type: "join", code: code.current } satisfies ClientMessage));
          started.current = true;
        } else if (message.type === "room") {
          code.current = message.room.code;
          setRoom(message.room);
          setError(null);
        } else if (message.type === "error") {
          setError(message.code);
        } else if (message.type === "left") {
          onLeftRef.current();
        }
      };
      ws.onclose = () => {
        if (closed || leaving.current) return;
        setStatus("reconnecting");
        retry = setTimeout(connect, Math.min(8000, 500 * 2 ** attempt++));
      };
    }

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      socket.current?.close();
    };
    // A conexão é aberta uma vez por montagem; nome e mensagem inicial valem para esse momento.
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(message));
  }, []);

  const leave = useCallback(() => {
    leaving.current = true;
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: "leave" } satisfies ClientMessage));
    else onLeftRef.current();
  }, []);

  return { room, status, error, send, leave };
}
