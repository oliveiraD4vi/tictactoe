import TicTacToe from './components/tictactoe/tictactoe';

import './styles/global.css';

const App = () => {
  return (
    <div className="app">
      <header>
        <h1>JOGO DA VELHA</h1>
      </header>

      <main>
        <TicTacToe />
      </main>

      <footer>
        <span>
          Made with ♡ by {' '}
          <a href="https://github.com/oliveiraD4vi" target="_blank" rel="noreferrer">
            Davi Oliveira
          </a>
        </span>
      </footer>
    </div>
  );
};

export default App;
