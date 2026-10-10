# Jogo da velha · Tic-tac-toe

Jogo da velha em **português e inglês** (`?lang=pt` ou `?lang=en` na URL), com três modos:

- **No mesmo aparelho:** dois jogadores, um tabuleiro, placar da sessão e início alternado.
- **Contra o computador:** fácil, médio ou impossível (minimax: no impossível, o melhor que dá
  para conseguir é empatar).
- **Online com amigos:** crie uma sala, mande o link ou o código e jogue em tempo real. O placar
  da sala fica guardado, a revanche precisa dos dois jogadores e quem começa alterna. Quem entra
  numa sala cheia assiste. Recarregar a página ou perder a conexão volta para a mesma cadeira.

**Jogue:** [tictactoe.coaladev.com.br](https://tictactoe.coaladev.com.br)

## Como funciona

As regras ficam em `src/game.ts` e são usadas tanto no navegador quanto no servidor de salas
(`server/`), que valida cada jogada. O servidor é um processo Node com WebSocket em `/ws` e também
serve o site.

## Rodando

```bash
npm install
npm run dev        # site em http://localhost:5173
npm run server     # salas em ws://localhost:4701/ws (em outro terminal)
npm run build && npm start   # site e salas juntos em http://localhost:4701
```

Com Docker:

```bash
docker build -t tictactoe .
docker run -p 4701:8080 tictactoe
```

Requer Node 22.18 ou mais novo (o servidor roda TypeScript direto).
