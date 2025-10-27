import { useState, useEffect } from 'react';
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

  //Barrier Blocks
  board[1][0].state = "barrier";
  board[1][2].state = "barrier";
  board[1][3].state = "barrier";
  board[2][0].state = "barrier";
  board[2][3].state = "barrier";
  board[3][0].state = "barrier";
  board[3][2].state = "barrier";
  board[3][3].state = "barrier";

  // Letter Blocks
board[0][0].state = 'filled';
board[0][0].value = 'F';

board[0][1].state = 'filled';
board[0][1].value = 'L';

board[0][2].state = 'filled';
board[0][2].value = 'W';

board[0][3].state = 'filled';
board[0][3].value = 'K';

board[4][0].state = 'filled';
board[4][0].value = 'R';

board[4][1].state = 'filled';
board[4][1].value = 'G';

board[4][2].state = 'filled';
board[4][2].value = 'O';

board[4][3].state = 'filled';
board[4][3].value = 'O';

  return board;
}


function App() {

  //initialize board dimensions
  const BOARD_LENGTH = 4;
  const BOARD_HEIGHT = 5;
  //initialize the correct words
  const correct_words = ["GOLF","WORK"];

  //make the board
  const [board, setBoard] = useState<Square[][]>(() =>
    makeInitialBoard(BOARD_HEIGHT, BOARD_LENGTH)
  );
  const [moves, setMoves] = useState(0);


  //Will swap a filled square with an empty square to slide
   function squareSlide(row1: number, col1: number, row2: number, col2: number) {
    setBoard((prevBoard: Square[][]) => {
      // deep copy while preserving Square type
      const newBoard: Square[][] = prevBoard.map((row: Square[]) =>
        row.map((cell: Square) => new Square(cell.state, cell.value, cell.selected))
      );

      const squareA = newBoard[row1][col1];
      const squareB = newBoard[row2][col2];

      // Only swap if one is filled and the other is empty
      const canSwap =
        (squareA.state === "filled" && squareB.state === "empty") ||
        (squareA.state === "empty" && squareB.state === "filled");

      if (canSwap) {
        const tempState = squareA.state;
        const tempValue = squareA.value;

        squareA.state = squareB.state;
        squareA.value = squareB.value;

        squareB.state = tempState;
        squareB.value = tempValue;

        setMoves((prev) => prev + 1);
        checkForWin(newBoard);
      }

      return newBoard;
    });
  }

  //Checks for win after every swap
  function checkForWin(board: Square[][]): boolean {
    let firstWord = "";
    let secondWord = "";
    for (let i=0;i<BOARD_LENGTH;i++){
      firstWord += (board[0][i].value)
    }
    for (let i=0;i<BOARD_LENGTH;i++){
      secondWord += (board[BOARD_HEIGHT - 1][i].value)
    }

      if (firstWord === correct_words[0] && secondWord === correct_words[1] ||
        firstWord === correct_words[1] && secondWord === correct_words[0]) {
        console.log("You win!");
        return true;
      }
      return false;
    }


/**
// Store the board in React state
  const [board] = useState<Square[][]>(() =>
    makeInitialBoard(BOARD_HEIGHT, BOARD_LENGTH)
  );

*/

  // Prints the board in console when it changes

  useEffect(() => {
    console.log("Board initialized:");
    console.table(board.map(row => row.map(cell => cell.state)));
    console.log(board);
  }, [board]);


  return (
    <div className="App">
      <h1>Slidewise</h1>
      <h2>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</h2>
      <p>Moves: {moves}</p>

      <div
        className="board"
        /**style={{
          display: "grid",
          gridTemplateColumns: `repeat(${BOARD_LENGTH}, 50px)`,
          gap: "6px",
          justifyContent: "center",
        }}*/
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`cell ${cell.state}`}
            >
              {cell.value ?? ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;