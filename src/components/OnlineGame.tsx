import { useEffect, useState } from "react";
import { isOver, outcome, turnOf, type Mark } from "../game";
import { useI18n } from "../i18n";
import type { ClientMessage } from "../protocol";
import { useRoom } from "../useRoom";
import { Board, MarkIcon } from "./Board";
import { Scoreboard } from "./OfflineGame";

interface Props {
  name: string;
  initial: ClientMessage;
  onExit: () => void;
}

export function OnlineGame({ name, initial, onExit }: Props) {
  const { t, lang } = useI18n();
  const { room, status, error, send, leave } = useRoom({ name, initial, onLeft: onExit });
  const [copied, setCopied] = useState(false);

  // O código fica na URL: recarregar a página volta para a mesma sala.
  const code = room?.code;
  useEffect(() => {
    if (code) history.replaceState(null, "", `${location.pathname}?sala=${code}&lang=${lang}`);
  }, [code, lang]);

  if (error && !room) {
    return (
      <div className="game center">
        <p className="status">{t.errors[error]}</p>
        <button type="button" className="btn btn-primary" onClick={onExit}>
          {t.back}
        </button>
      </div>
    );
  }
  if (!room) return <p className="status">{status === "reconnecting" ? t.reconnecting : t.connecting}</p>;

  const players = Object.fromEntries(room.players.map((p) => [p.mark, p])) as Partial<Record<Mark, (typeof room.players)[number]>>;
  const names: Record<Mark, string> = { X: players.X?.name ?? t.waitingPlayer, O: players.O?.name ?? t.waitingPlayer };
  const full = Boolean(players.X && players.O);
  const result = outcome(room.board);
  const over = isOver(room.board);
  const turn = turnOf(room.board, room.starter);
  const myTurn = room.you !== null && room.you === turn && full && !over;
  const iAskedRematch = room.you !== null && players[room.you]?.rematch;
  // O link de convite não leva o idioma: cada um abre no seu.
  const link = `${location.origin}${location.pathname}?sala=${room.code}`;

  let message: string;
  if (!full) message = t.waitingOpponent;
  else if (result.winner) message = result.winner === room.you ? t.youWon : t.someoneWon(names[result.winner]);
  else if (result.draw) message = t.draw;
  else message = myTurn ? t.yourTurn : t.turnOf(names[turn]);

  return (
    <div className="game">
      {status === "reconnecting" && <p className="warn">{t.reconnecting}</p>}
      <header className="game-head">
        <p className="eyebrow">
          {t.room(room.code)}
          {room.you ? ` · ${t.youAre(room.you)}` : ` · ${t.watching}`}
          {room.spectators > 0 && ` · ${t.spectators(room.spectators)}`}
        </p>
        <Scoreboard names={names} score={room.score} turn={full && !over ? turn : null} online={{ X: players.X?.online, O: players.O?.online }} />
      </header>

      {!full && (
        <div className="invite">
          <p>{t.invite}</p>
          <div className="invite-row">
            <code>{link}</code>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  prompt(t.copyLink, link);
                }
              }}
            >
              {copied ? t.copied : t.copyLink}
            </button>
          </div>
          <p className="muted small">
            {t.orCode} <strong>{room.code}</strong>.
          </p>
        </div>
      )}

      <p className="status" data-tone={result.winner ? (result.winner === room.you || !room.you ? "win" : "lose") : result.draw ? "draw" : "turn"} aria-live="polite">
        {full && !over && <MarkIcon mark={turn} />}
        {message}
      </p>
      <Board board={room.board} canPlay={myTurn} turn={turn} onPlay={(index) => send({ type: "move", index })} />

      <div className="actions">
        {over && room.you && full && (
          <button type="button" className="btn btn-primary" disabled={iAskedRematch} onClick={() => send({ type: "rematch" })}>
            {iAskedRematch ? t.waitingRematch : room.players.some((p) => p.rematch) ? t.acceptRematch : t.askRematch}
          </button>
        )}
        <button type="button" className="btn" onClick={leave}>
          {t.leave}
        </button>
      </div>
    </div>
  );
}
