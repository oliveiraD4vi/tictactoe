// Regras do jogo da velha, compartilhadas entre o navegador e o servidor.

export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Board = Cell[];

export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export const emptyBoard = (): Board => Array<Cell>(9).fill(null);
export const other = (mark: Mark): Mark => (mark === "X" ? "O" : "X");

export interface Outcome {
  winner: Mark | null;
  line: readonly number[] | null;
  draw: boolean;
}

export function outcome(board: Board): Outcome {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line, draw: false };
  }
  return { winner: null, line: null, draw: board.every(Boolean) };
}

export const isOver = (board: Board) => {
  const o = outcome(board);
  return o.winner !== null || o.draw;
};

/** De quem é a vez, sabendo quem começou. */
export function turnOf(board: Board, starter: Mark): Mark {
  const played = board.filter(Boolean).length;
  return played % 2 === 0 ? starter : other(starter);
}

export function canPlay(board: Board, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < 9 && board[index] === null && !isOver(board);
}

export function play(board: Board, index: number, mark: Mark): Board {
  const next = board.slice();
  next[index] = mark;
  return next;
}

// ---------- Computador ----------

export type Difficulty = "facil" | "medio" | "impossivel";

function minimax(board: Board, turn: Mark, me: Mark, depth: number): number {
  const { winner, draw } = outcome(board);
  if (winner) return winner === me ? 10 - depth : depth - 10;
  if (draw) return 0;
  const scores = board.flatMap((cell, i) => (cell ? [] : [minimax(play(board, i, turn), other(turn), me, depth + 1)]));
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(board: Board, me: Mark): number {
  let best = -Infinity;
  let moves: number[] = [];
  board.forEach((cell, i) => {
    if (cell) return;
    const score = minimax(play(board, i, me), other(me), me, 1);
    if (score > best) {
      best = score;
      moves = [i];
    } else if (score === best) moves.push(i);
  });
  return moves[Math.floor(Math.random() * moves.length)];
}

function randomMove(board: Board): number {
  const free = board.flatMap((cell, i) => (cell ? [] : [i]));
  return free[Math.floor(Math.random() * free.length)];
}

export function computerMove(board: Board, me: Mark, difficulty: Difficulty): number {
  if (difficulty === "facil") return Math.random() < 0.25 ? bestMove(board, me) : randomMove(board);
  if (difficulty === "medio") return Math.random() < 0.7 ? bestMove(board, me) : randomMove(board);
  return bestMove(board, me);
}
