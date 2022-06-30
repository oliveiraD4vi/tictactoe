import { useEffect, useState } from 'react';
import './tictactoe.css';

const TicTacToe = () => {
  const empty = Array(9).fill("");

  const [board, setBoard] = useState(empty);
  const [player, setPlayer] = useState(true);
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] =useState(false);

  // eslint-disable-next-line
  useEffect(() => check(), [board]);

  const onReset = () => {
    setBoard(empty);
    setPlayer(true);
    setWinner(null);
    setDraw(false);
  };

  const handleClick = (i) => {
    if (board[i] === "" && !winner) {
      setBoard(board.map(
        (item, index) => index === i
          ? player
          ? "X"
          : "O"
          : item
      ));
      setPlayer((state) => !state);
    }
  };

  const check = () => {
    const combinations = [
      [board[0], board[1], board[2]],
      [board[0], board[3], board[6]],
      [board[0], board[4], board[8]],
      [board[1], board[4], board[7]],
      [board[2], board[5], board[8]],
      [board[2], board[4], board[6]],
      [board[3], board[4], board[5]],
      [board[6], board[7], board[8]]
    ];

    combinations.forEach((cells) => {
      if (cells.every((cell) => cell === "O")) setWinner("O");
      if (cells.every((cell) => cell === "X")) setWinner("X");
    });

    if (board.every((cell) => cell !== "")) setDraw(true);
  };

  return (
    <div className="tictactoe-container">
      <div className={`board ${winner ? 'game-over' : null}`}>
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

      {winner ? (
        <h1 className="message">
          <span className={winner}>{winner}</span> venceu!
        </h1>
      ) : draw ? (
        <h1 className="message">Empatou!</h1>
      ) : null}

      <div className="btn-container">
        <button
          className="reset-button"
          onClick={() => onReset()}
        >
          RECOMEÇAR
        </button>
      </div>
    </div>
  );
};

export default TicTacToe;
