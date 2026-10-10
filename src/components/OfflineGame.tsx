import { useEffect, useState } from "react";
import { canPlay, computerMove, emptyBoard, other, outcome, play, turnOf, type Difficulty, type Mark } from "../game";
import { Board, MarkIcon } from "./Board";

interface Props {
  /** "local": dois jogadores no mesmo aparelho. "bot": você (X) contra o computador (O). */
  mode: "local" | "bot";
  difficulty: Difficulty;
  name: string;
  onExit: () => void;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = { facil: "fácil", medio: "médio", impossivel: "impossível" };

export function OfflineGame({ mode, difficulty, name, onExit }: Props) {
  const [board, setBoard] = useState(emptyBoard);
  const [starter, setStarter] = useState<Mark>("X");
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const result = outcome(board);
  const over = result.winner !== null || result.draw;
  const turn = turnOf(board, starter);
  const botTurn = mode === "bot" && turn === "O" && !over;

  const names: Record<Mark, string> = mode === "bot" ? { X: name || "Você", O: "Computador" } : { X: "Jogador X", O: "Jogador O" };

  function move(index: number) {
    if (!canPlay(board, index)) return;
    const next = play(board, index, turn);
    setBoard(next);
    const r = outcome(next);
    if (r.winner) setScore((s) => ({ ...s, [r.winner!]: s[r.winner!] + 1 }));
    else if (r.draw) setScore((s) => ({ ...s, draws: s.draws + 1 }));
  }

  // O computador pensa um pouquinho antes de jogar, para dar tempo de ver a jogada anterior.
  useEffect(() => {
    if (!botTurn) return;
    const id = setTimeout(() => move(computerMove(board, "O", difficulty)), 450);
    return () => clearTimeout(id);
  });

  function rematch() {
    setBoard(emptyBoard());
    setStarter((s) => other(s));
  }

  let status: string;
  if (result.winner) status = mode === "bot" ? (result.winner === "X" ? "Você venceu!" : "O computador venceu") : `${names[result.winner]} venceu!`;
  else if (result.draw) status = "Deu velha!";
  else status = mode === "bot" ? (turn === "X" ? "Sua vez" : "O computador está pensando…") : `Vez de ${names[turn]}`;

  return (
    <div className="game">
      <header className="game-head">
        <p className="eyebrow">{mode === "bot" ? `Contra o computador · ${DIFFICULTY_LABEL[difficulty]}` : "No mesmo aparelho"}</p>
        <Scoreboard names={names} score={score} turn={over ? null : turn} />
      </header>

      <p className="status" data-tone={result.winner ? "win" : result.draw ? "draw" : "turn"} aria-live="polite">
        {!over && <MarkIcon mark={turn} />}
        {status}
      </p>
      <Board board={board} canPlay={!over && !botTurn} turn={turn} onPlay={move} />

      <div className="actions">
        {over && (
          <button type="button" className="btn btn-primary" onClick={rematch}>
            Jogar de novo
          </button>
        )}
        <button type="button" className="btn" onClick={onExit}>
          Voltar
        </button>
      </div>
      {over && <p className="muted small center-text">Na próxima, começa {names[other(starter)]}.</p>}
    </div>
  );
}

export function Scoreboard({
  names,
  score,
  turn,
  online,
}: {
  names: Record<Mark, string>;
  score: { X: number; O: number; draws: number };
  turn: Mark | null;
  online?: Partial<Record<Mark, boolean>>;
}) {
  return (
    <dl className="scoreboard">
      {(["X", "O"] as Mark[]).map((m) => (
        <div key={m} className="score-player" data-turn={turn === m} data-mark={m}>
          <dt>
            <MarkIcon mark={m} />
            <span className="score-name">{names[m]}</span>
            {online && online[m] === false && <span className="tag">fora</span>}
          </dt>
          <dd>{score[m]}</dd>
        </div>
      ))}
      <div className="score-draws">
        <dt>Velhas</dt>
        <dd>{score.draws}</dd>
      </div>
    </dl>
  );
}
