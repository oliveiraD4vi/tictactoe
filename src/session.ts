// Preferências guardadas no navegador. Tudo tem valor padrão se o armazenamento falhar.

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sem armazenamento local: segue sem salvar */
  }
}

/** Identificador desta pessoa nas salas; permite voltar ao mesmo lugar depois de recarregar. */
export function sessionId(): string {
  let id = get("velha:session");
  if (!id) {
    id = crypto.randomUUID();
    set("velha:session", id);
  }
  return id;
}

export const savedName = () => get("velha:name") ?? "";
export const saveName = (name: string) => set("velha:name", name.trim());
