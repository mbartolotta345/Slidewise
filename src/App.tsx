import { useState, useEffect } from "react";
import "./App.css";

class Square {
  state: "empty" | "filled" | "barrier";
  value: string | null;
  selected: boolean;

  constructor(
    state: "empty" | "filled" | "barrier" = "empty",
    value: string | null = null,
    selected: boolean = false
  ) {
    this.state = state;
    this.value = value;
    this.selected = selected;
  }
}

function makeInitialBoard(height: number, length: number): Square[][] {
  const board = Array.from({ length: height }, () =>
    Array.from({ length }, () => new Square())
  );

  // Barrier Blocks
  board[1][0].state = "barrier";
  board[1][2].state = "barrier";
  board[1][3].state = "barrier";
  board[2][0].state = "barrier";
  board[2][3].state = "barrier";
  board[3][0].state = "barrier";
  board[3][2].state = "barrier";
  board[3][3].state = "barrier";

  // Letter Blocks
  // board[0][0].state = "filled"; board[0][0].value = "F";
  // board[0][1].state = "filled"; board[0][1].value = "L";
  // board[0][2].state = "filled"; board[0][2].value = "W";
  // board[0][3].state = "filled"; board[0][3].value = "K";

  // board[4][0].state = "filled"; board[4][0].value = "R";
  // board[4][1].state = "filled"; board[4][1].value = "G";
  // board[4][2].state = "filled"; board[4][2].value = "O";
  // board[4][3].state = "filled"; board[4][3].value = "O";

  //Testing win condition
  board[0][0].state = "filled"; board[0][0].value = "G";
  board[0][1].state = "filled"; board[0][1].value = "O";
  board[0][2].state = "filled"; board[0][2].value = "L";
  board[0][3].state = "filled"; board[0][3].value = "F";

  board[4][0].state = "filled"; board[4][0].value = "W";
  board[4][1].state = "filled"; board[4][1].value = "O";
  board[4][2].state = "filled"; board[4][2].value = "R";
  board[4][3].state = "filled"; board[4][3].value = "K";

  return board;
}

export default function App() {
  // Board constants
  const BOARD_LENGTH = 4;
  const BOARD_HEIGHT = 5;
  const correct_words = ["GOLF", "WORK"];

  // State
  const [board, setBoard] = useState<Square[][]>(() =>
    makeInitialBoard(BOARD_HEIGHT, BOARD_LENGTH)
  );
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(
    null
  );

  // Helpers
  function cloneBoard(b: Square[][]): Square[][] {
    return b.map((row) => row.map((cell) => new Square(cell.state, cell.value, cell.selected)));
  }

  function checkForWin(b: Square[][]): boolean {
    let firstWord = "";
    let secondWord = "";
    for (let i = 0; i < BOARD_LENGTH; i++) {
      firstWord += b[0][i].value ?? "";
      secondWord += b[BOARD_HEIGHT - 1][i].value ?? "";
    }

    const win =
      (firstWord === correct_words[0] && secondWord === correct_words[1]) ||
      (firstWord === correct_words[1] && secondWord === correct_words[0]);

    if (win) {
      console.log("You win!");
    }
    return win;
  }

  function squareSlide(r1: number, c1: number, r2: number, c2: number) {
    setBoard((prev) => {
      const newBoard = cloneBoard(prev);

      const A = newBoard[r1][c1];
      const B = newBoard[r2][c2];

      const canSwap =
        (A.state === "filled" && B.state === "empty") ||
        (A.state === "empty" && B.state === "filled");

      if (canSwap) {
        const tmpState = A.state;
        const tmpValue = A.value;

        A.state = B.state;
        A.value = B.value;
        B.state = tmpState;
        B.value = tmpValue;

        A.selected = false;
        B.selected = false;

        setMoves((m) => m + 1);
        checkForWin(newBoard);
      }

      return newBoard;
    });

    // clear first selection coordinate
    setSelected(null);
  }

  function onCellClick(r: number, c: number) {
    const cell = board[r][c];
    if (cell.state === "barrier") return; // ignore barriers

    //Select first square
    if (!selected) {
      setSelected({ r, c });
      setBoard((prev) => {
        const newBoard = cloneBoard(prev);
        for (let i = 0; i < newBoard.length; i++) {
          for (let j = 0; j < newBoard[i].length; j++) {
            newBoard[i][j].selected = i === r && j === c;
          }
        }
        return newBoard;
      });
      return;
    }

    //If clicked same cell then deselect
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      setBoard((prev) => {
        const newBoard = cloneBoard(prev);
        newBoard[r][c].selected = false;
        return newBoard;
      });
      return;
    }

    //Second cell clicked
    squareSlide(selected.r, selected.c, r, c);
  }

  useEffect(() => {
    console.log("Board updated:");
    console.table(board.map((row) => row.map((cell) => cell.state[0])));
  }, [board]);

  return (
    <div className="App">
      <h1>Slidewise</h1>
      <h2>
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </h2>
      <p>Moves: {moves}</p>

      <div
        className="board">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`cell ${cell.state} ${cell.selected ? "selected" : ""}`}
              onClick={() => onCellClick(r, c)}
            >
              {cell.value ?? ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
