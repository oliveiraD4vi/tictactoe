// Mensagens trocadas pelo WebSocket entre o navegador e o servidor de salas.
import type { Board, Mark } from "./game.ts";

export interface PlayerView {
  name: string;
  mark: Mark;
  online: boolean;
  /** Pediu revanche depois do fim da partida. */
  rematch: boolean;
}

export interface RoomView {
  code: string;
  board: Board;
  /** Quem começou a partida atual (alterna a cada revanche). */
  starter: Mark;
  players: PlayerView[];
  spectators: number;
  score: { X: number; O: number; draws: number };
  /** Sua marca nesta sala, ou null se você só está assistindo. */
  you: Mark | null;
}

export type ClientMessage =
  | { type: "hello"; session: string; name: string }
  | { type: "create" }
  | { type: "join"; code: string }
  | { type: "move"; index: number }
  | { type: "rematch" }
  | { type: "leave" };

export type ServerMessage =
  | { type: "ready" }
  | { type: "room"; room: RoomView }
  | { type: "left" }
  | { type: "error"; code: ErrorCode };

export type ErrorCode = "roomNotFound" | "badSession" | "notReady";

export const CODE_LENGTH = 4;
/** Sem letras e números que se confundem (O/0, I/1). */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_NAME = 20;

export const normalizeCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);
