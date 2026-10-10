import { useEffect, useMemo, useState } from "react";
import { OfflineGame } from "./components/OfflineGame";
import { OnlineGame } from "./components/OnlineGame";
import type { Difficulty } from "./game";
import { LangContext, STRINGS, initialLang, saveLang, type Lang } from "./i18n";
import { CODE_LENGTH, normalizeCode, type ClientMessage } from "./protocol";
import { saveName, savedName } from "./session";

type Screen =
  | { id: "home" }
  | { id: "local" }
  | { id: "bot"; difficulty: Difficulty }
  | { id: "online"; initial: ClientMessage };

const DIFFICULTIES: Difficulty[] = ["facil", "medio", "impossivel"];

const codeFromUrl = () => normalizeCode(new URLSearchParams(location.search).get("sala") ?? "");

export function App() {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const t = STRINGS[lang];
  const i18n = useMemo(
    () => ({
      lang,
      t,
      setLang: (next: Lang) => {
        saveLang(next);
        setLangState(next);
      },
    }),
    [lang, t],
  );
  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    document.title = t.title;
  }, [lang, t]);

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
    <LangContext.Provider value={i18n}>
      <div className="page">
        <header className="top">
          <button type="button" className="brand" onClick={home}>
            <span className="logo" aria-hidden="true">
              #
            </span>
            {t.title}
          </button>
          <div className="lang" role="group" aria-label={t.language}>
            {(["pt", "en"] as Lang[]).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => i18n.setLang(l)} lang={l === "pt" ? "pt-BR" : "en"}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <main className="main">
          {screen.id === "home" && (
            <div className="home">
              <section className="intro">
                <h1>{t.title}</h1>
                <p className="lead">{t.lead}</p>
                <label className="name-field">
                  <span className="label">{t.yourName}</span>
                  <input value={name} maxLength={20} placeholder={t.namePlaceholder} autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
                </label>

                <div className="mode mode-online">
                  <strong>{t.online}</strong>
                  <span>{t.onlineHint}</span>
                  <button type="button" className="btn btn-primary" disabled={!hasName} onClick={() => goOnline({ type: "create" })}>
                    {t.createRoom}
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
                      placeholder={t.code}
                      aria-label={t.roomCode}
                      maxLength={CODE_LENGTH}
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => setCode(normalizeCode(e.target.value))}
                    />
                    <button type="submit" className="btn" disabled={code.length !== CODE_LENGTH || !hasName}>
                      {t.join}
                    </button>
                  </form>
                  {!hasName && <span className="hint">{t.needName}</span>}
                </div>
              </section>

              <section className="modes">
                <button type="button" className="mode mode-local" onClick={() => setScreen({ id: "local" })}>
                  <strong>{t.local}</strong>
                  <span>{t.localHint}</span>
                </button>

                <div className="mode mode-bot">
                  <strong>{t.bot}</strong>
                  <div className="segmented" role="group" aria-label={t.difficulty}>
                    {DIFFICULTIES.map((d) => (
                      <button key={d} type="button" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>
                        {t.difficulties[d]}
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
                    {t.play}
                  </button>
                </div>
              </section>
            </div>
          )}

          {screen.id === "local" && <OfflineGame mode="local" difficulty="medio" name={name} onExit={home} />}
          {screen.id === "bot" && <OfflineGame mode="bot" difficulty={screen.difficulty} name={name.trim()} onExit={home} />}
          {screen.id === "online" && <OnlineGame name={name.trim()} initial={screen.initial} onExit={home} />}
        </main>

        <footer className="foot">
          <span>{t.title}</span>
          <a href={lang === "pt" ? "https://coaladev.com.br" : "https://coaladev.com.br/en/"} target="_blank" rel="noopener">
            Davi Oliveira
          </a>
        </footer>
      </div>
    </LangContext.Provider>
  );
}
