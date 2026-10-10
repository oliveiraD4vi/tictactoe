import { useEffect, useState } from "react";
import { isOver, outcome, turnOf, type Mark } from "../game";
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
  const { room, status, error, send, leave } = useRoom({ name, initial, onLeft: onExit });
  const [copied, setCopied] = useState(false);

  // O código fica na URL: recarregar a página volta para a mesma sala.
  const code = room?.code;
  useEffect(() => {
    if (code) history.replaceState(null, "", `${location.pathname}?sala=${code}`);
  }, [code]);

  if (error && !room) {
    return (
      <div className="game center">
        <p className="status">{error}</p>
        <button type="button" className="btn btn-primary" onClick={onExit}>
          Voltar
        </button>
      </div>
    );
  }
  if (!room) return <p className="status">{status === "reconnecting" ? "Conexão perdida. Tentando de novo…" : "Conectando…"}</p>;

  const players = Object.fromEntries(room.players.map((p) => [p.mark, p])) as Partial<Record<Mark, (typeof room.players)[number]>>;
  const names: Record<Mark, string> = { X: players.X?.name ?? "Aguardando…", O: players.O?.name ?? "Aguardando…" };
  const full = Boolean(players.X && players.O);
  const result = outcome(room.board);
  const over = isOver(room.board);
  const turn = turnOf(room.board, room.starter);
  const myTurn = room.you !== null && room.you === turn && full && !over;
  const iAskedRematch = room.you !== null && players[room.you]?.rematch;
  const link = `${location.origin}${location.pathname}?sala=${room.code}`;

  let message: string;
  if (!full) message = "Esperando o adversário entrar…";
  else if (result.winner) message = result.winner === room.you ? "Você venceu!" : `${names[result.winner]} venceu`;
  else if (result.draw) message = "Deu velha!";
  else if (room.you === null) message = `Vez de ${names[turn]}`;
  else message = myTurn ? "Sua vez" : `Vez de ${names[turn]}`;

  return (
    <div className="game">
      {status === "reconnecting" && <p className="warn">Conexão perdida. Tentando de novo…</p>}
      <header className="game-head">
        <p className="eyebrow">
          Sala {room.code}
          {room.you ? ` · você é o ${room.you}` : " · assistindo"}
          {room.spectators > 0 && ` · ${room.spectators} ${room.spectators === 1 ? "pessoa assistindo" : "pessoas assistindo"}`}
        </p>
        <Scoreboard names={names} score={room.score} turn={full && !over ? turn : null} online={{ X: players.X?.online, O: players.O?.online }} />
      </header>

      {!full && (
        <div className="invite">
          <p>Mande o link para alguém jogar com você:</p>
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
                  prompt("Copie o link:", link);
                }
              }}
            >
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
          <p className="muted small">
            Ou passe o código <strong>{room.code}</strong>.
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
            {iAskedRematch ? "Esperando o outro aceitar…" : room.players.some((p) => p.rematch) ? "Aceitar revanche" : "Pedir revanche"}
          </button>
        )}
        <button type="button" className="btn" onClick={leave}>
          Sair da sala
        </button>
      </div>
    </div>
  );
}
