// Textos do jogo em português e inglês.
import { createContext, useContext } from "react";
import type { Difficulty, Mark } from "./game";
import type { ErrorCode } from "./protocol";

export type Lang = "pt" | "en";

const pt = {
  title: "Jogo da velha",
  lead: "Jogue com alguém do seu lado, desafie o computador ou chame um amigo para uma partida online.",
  yourName: "Seu nome",
  namePlaceholder: "Como você quer aparecer",
  online: "Online com amigos",
  onlineHint: "Crie uma sala e mande o link",
  createRoom: "Criar sala",
  code: "Código",
  roomCode: "Código da sala",
  join: "Entrar",
  needName: "Escreva seu nome para jogar online.",
  local: "No mesmo aparelho",
  localHint: "Dois jogadores, um tabuleiro",
  bot: "Contra o computador",
  play: "Jogar",
  difficulty: "Dificuldade",
  difficulties: { facil: "Fácil", medio: "Médio", impossivel: "Impossível" } as Record<Difficulty, string>,
  vsComputer: (d: string) => `Contra o computador · ${d.toLowerCase()}`,
  sameDevice: "No mesmo aparelho",
  you: "Você",
  computer: "Computador",
  player: (m: Mark) => `Jogador ${m}`,
  draws: "Velhas",
  away: "fora",
  youWon: "Você venceu!",
  computerWon: "O computador venceu",
  someoneWon: (name: string) => `${name} venceu!`,
  draw: "Deu velha!",
  yourTurn: "Sua vez",
  thinking: "O computador está pensando…",
  turnOf: (name: string) => `Vez de ${name}`,
  playAgain: "Jogar de novo",
  back: "Voltar",
  nextStarts: (name: string) => `Na próxima, começa ${name}.`,
  waitingPlayer: "Aguardando…",
  waitingOpponent: "Esperando o adversário entrar…",
  room: (code: string) => `Sala ${code}`,
  youAre: (m: Mark) => `você é o ${m}`,
  watching: "assistindo",
  spectators: (n: number) => (n === 1 ? "1 pessoa assistindo" : `${n} pessoas assistindo`),
  invite: "Mande o link para alguém jogar com você:",
  copyLink: "Copiar link",
  copied: "Copiado!",
  orCode: "Ou passe o código",
  askRematch: "Pedir revanche",
  acceptRematch: "Aceitar revanche",
  waitingRematch: "Esperando o outro aceitar…",
  leave: "Sair da sala",
  connecting: "Conectando…",
  reconnecting: "Conexão perdida. Tentando de novo…",
  board: "Tabuleiro",
  empty: "vazio",
  cells: ["canto superior esquerdo", "topo", "canto superior direito", "esquerda", "centro", "direita", "canto inferior esquerdo", "base", "canto inferior direito"],
  errors: {
    roomNotFound: "Sala não encontrada. Confira o código.",
    badSession: "Não foi possível identificar esta sessão. Recarregue a página.",
    notReady: "Conexão ainda não identificada.",
  } as Record<ErrorCode, string>,
  language: "Idioma",
};

const en: typeof pt = {
  title: "Tic-tac-toe",
  lead: "Play with someone next to you, challenge the computer or invite a friend to an online match.",
  yourName: "Your name",
  namePlaceholder: "How others will see you",
  online: "Online with friends",
  onlineHint: "Create a room and share the link",
  createRoom: "Create room",
  code: "Code",
  roomCode: "Room code",
  join: "Join",
  needName: "Type your name to play online.",
  local: "On this device",
  localHint: "Two players, one board",
  bot: "Against the computer",
  play: "Play",
  difficulty: "Difficulty",
  difficulties: { facil: "Easy", medio: "Medium", impossivel: "Impossible" },
  vsComputer: (d: string) => `Against the computer · ${d.toLowerCase()}`,
  sameDevice: "On this device",
  you: "You",
  computer: "Computer",
  player: (m: Mark) => `Player ${m}`,
  draws: "Draws",
  away: "away",
  youWon: "You won!",
  computerWon: "The computer won",
  someoneWon: (name: string) => `${name} won!`,
  draw: "It's a draw!",
  yourTurn: "Your turn",
  thinking: "The computer is thinking…",
  turnOf: (name: string) => `${name}'s turn`,
  playAgain: "Play again",
  back: "Back",
  nextStarts: (name: string) => `${name} starts the next one.`,
  waitingPlayer: "Waiting…",
  waitingOpponent: "Waiting for an opponent to join…",
  room: (code: string) => `Room ${code}`,
  youAre: (m: Mark) => `you are ${m}`,
  watching: "watching",
  spectators: (n: number) => (n === 1 ? "1 person watching" : `${n} people watching`),
  invite: "Send the link to someone to play with you:",
  copyLink: "Copy link",
  copied: "Copied!",
  orCode: "Or share the code",
  askRematch: "Ask for a rematch",
  acceptRematch: "Accept rematch",
  waitingRematch: "Waiting for the other player…",
  leave: "Leave room",
  connecting: "Connecting…",
  reconnecting: "Connection lost. Retrying…",
  board: "Board",
  empty: "empty",
  cells: ["top left", "top", "top right", "left", "center", "right", "bottom left", "bottom", "bottom right"],
  errors: {
    roomNotFound: "Room not found. Check the code.",
    badSession: "Couldn't identify this session. Reload the page.",
    notReady: "Connection not identified yet.",
  },
  language: "Language",
};

export type Strings = typeof pt;
export const STRINGS: Record<Lang, Strings> = { pt, en };

/** Idioma inicial: ?lang= na URL (vem do portfólio), depois o salvo, depois o do navegador. */
export function initialLang(): Lang {
  const param = new URLSearchParams(location.search).get("lang");
  if (param === "pt" || param === "en") return param;
  try {
    const saved = localStorage.getItem("velha:lang");
    if (saved === "pt" || saved === "en") return saved;
  } catch {
    /* sem armazenamento local */
  }
  return navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem("velha:lang", lang);
  } catch {
    /* sem armazenamento local */
  }
}

export const LangContext = createContext<{ lang: Lang; t: Strings; setLang: (lang: Lang) => void }>({
  lang: "pt",
  t: pt,
  setLang: () => {},
});

export const useI18n = () => useContext(LangContext);
