import { useState } from 'react';
import './tictactoe.css';

const TicTacToe = () => {
  const empty = Array(9).fill("");
  const [board, setBoard] = useState(empty);
  const [player, setPlayer] = useState(true);

  const onReset = () => {
    setBoard(empty);
    setPlayer(true);
  };

  const handleClick = (i) => {
    setBoard(board.map(
      (item, index) => index === i
        ? player
        ? "X"
        : "O"
        : item
    ));
    setPlayer((state) => !state);
  };

  return (
    <div className="tictactoe-container">
      <div className="board">
        {board.map((item, index) => (
          <div
            key={index}
            onClick={() => handleClick(index)}
            className={`cell ${item}`}
          >
            {item}
          </div>
        ))}
      </div>

      <div className="btn-container">
        <button
          className="reset-button"
          onClick={() => onReset()}
        >
          RESETAR
        </button>
      </div>
    </div>
  );
};

export default TicTacToe;
