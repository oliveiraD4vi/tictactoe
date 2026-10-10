import { useState } from "react";
import { OfflineGame } from "./components/OfflineGame";
import { OnlineGame } from "./components/OnlineGame";
import type { Difficulty } from "./game";
import { CODE_LENGTH, normalizeCode, type ClientMessage } from "./protocol";
import { saveName, savedName } from "./session";

type Screen =
  | { id: "home" }
  | { id: "local" }
  | { id: "bot"; difficulty: Difficulty }
  | { id: "online"; initial: ClientMessage };

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "facil", label: "Fácil" },
  { id: "medio", label: "Médio" },
  { id: "impossivel", label: "Impossível" },
];

const codeFromUrl = () => normalizeCode(new URLSearchParams(location.search).get("sala") ?? "");

export function App() {
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState(codeFromUrl);
  const [difficulty, setDifficulty] = useState<Difficulty>("medio");
  // Link de convite com nome já salvo: entra direto na sala.
  const [screen, setScreen] = useState<Screen>(() =>
    code.length === CODE_LENGTH && savedName() ? { id: "online", initial: { type: "join", code } } : { id: "home" },
  );

  const home = () => {
    history.replaceState(null, "", location.pathname);
    setScreen({ id: "home" });
  };
  const hasName = name.trim().length > 0;
  const goOnline = (initial: ClientMessage) => {
    saveName(name);
    setScreen({ id: "online", initial });
  };

  return (
    <div className="page">
      <header className="top">
        <button type="button" className="brand" onClick={home}>
          <span className="logo" aria-hidden="true">
            #
          </span>
          Jogo da velha
        </button>
      </header>

      <main className="main">
        {screen.id === "home" && (
          <div className="home">
            <section className="intro">
              <h1>Jogo da velha</h1>
              <p className="lead">Jogue com alguém do seu lado, desafie o computador ou chame um amigo para uma partida online.</p>
              <label className="name-field">
                <span className="label">Seu nome</span>
                <input value={name} maxLength={20} placeholder="Como você quer aparecer" autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
              </label>
            </section>

            <section className="modes">
              <button type="button" className="mode mode-local" onClick={() => setScreen({ id: "local" })}>
                <strong>No mesmo aparelho</strong>
                <span>Dois jogadores, um tabuleiro</span>
              </button>

              <div className="mode mode-bot">
                <strong>Contra o computador</strong>
                <div className="segmented" role="group" aria-label="Dificuldade">
                  {DIFFICULTIES.map((d) => (
                    <button key={d.id} type="button" aria-pressed={difficulty === d.id} onClick={() => setDifficulty(d.id)}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    saveName(name);
                    setScreen({ id: "bot", difficulty });
                  }}
                >
                  Jogar
                </button>
              </div>

              <div className="mode mode-online">
                <strong>Online com amigos</strong>
                <span>Crie uma sala e mande o link</span>
                <button type="button" className="btn" disabled={!hasName} onClick={() => goOnline({ type: "create" })}>
                  Criar sala
                </button>
                <form
                  className="join"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (code.length === CODE_LENGTH && hasName) goOnline({ type: "join", code });
                  }}
                >
                  <input
                    value={code}
                    placeholder="Código"
                    aria-label="Código da sala"
                    maxLength={CODE_LENGTH}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setCode(normalizeCode(e.target.value))}
                  />
                  <button type="submit" className="btn" disabled={code.length !== CODE_LENGTH || !hasName}>
                    Entrar
                  </button>
                </form>
                {!hasName && <span className="hint">Escreva seu nome para jogar online.</span>}
              </div>
            </section>
          </div>
        )}

        {screen.id === "local" && <OfflineGame mode="local" difficulty="medio" name={name} onExit={home} />}
        {screen.id === "bot" && <OfflineGame mode="bot" difficulty={screen.difficulty} name={name.trim()} onExit={home} />}
        {screen.id === "online" && <OnlineGame name={name.trim()} initial={screen.initial} onExit={home} />}
      </main>

      <footer className="foot">
        <span>Jogo da velha</span>
        <a href="https://coaladev.com.br" target="_blank" rel="noopener">
          Davi Oliveira
        </a>
      </footer>
    </div>
  );
}
