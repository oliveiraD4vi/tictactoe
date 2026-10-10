import { outcome, type Board as BoardState, type Mark } from "../game";

interface Props {
  board: BoardState;
  /** Pode jogar agora (é a sua vez e a partida não acabou). */
  canPlay: boolean;
  /** Marca de quem joga agora, para a prévia ao passar o mouse. */
  turn: Mark;
  onPlay: (index: number) => void;
}

const POSITIONS = ["canto superior esquerdo", "topo", "canto superior direito", "esquerda", "centro", "direita", "canto inferior esquerdo", "base", "canto inferior direito"];

export function Board({ board, canPlay, turn, onPlay }: Props) {
  const { line } = outcome(board);
  return (
    <div className="board" role="grid" aria-label="Tabuleiro" data-over={line !== null}>
      {board.map((cell, i) => (
        <button
          key={i}
          type="button"
          className="cell"
          data-mark={cell ?? ""}
          data-preview={!cell && canPlay ? turn : ""}
          data-win={line?.includes(i) ?? false}
          disabled={!canPlay || cell !== null}
          onClick={() => onPlay(i)}
          aria-label={`${POSITIONS[i]}: ${cell ?? "vazio"}`}
        >
          {cell && <MarkIcon mark={cell} />}
        </button>
      ))}
    </div>
  );
}

export function MarkIcon({ mark }: { mark: Mark }) {
  return mark === "X" ? (
    <svg viewBox="0 0 100 100" className="mark mark-x" aria-hidden="true">
      <path d="M22 22l56 56M78 22l-56 56" />
    </svg>
  ) : (
    <svg viewBox="0 0 100 100" className="mark mark-o" aria-hidden="true">
      <circle cx="50" cy="50" r="29" />
    </svg>
  );
}
