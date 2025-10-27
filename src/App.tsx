import { useState, useEffect } from 'react';

import './App.css'


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
  board[1][0].state = "barrier";
  board[1][2].state = "barrier";
  board[1][3].state = "barrier";
  board[2][0].state = "barrier";
  board[2][3].state = "barrier";
  board[3][0].state = "barrier";
  board[3][2].state = "barrier";
  board[3][3].state = "barrier";
  return board;
}


function App() {
  
  //initialize board dimensions
  const BOARD_LENGTH = 4;
  const BOARD_HEIGHT = 5;

  //make the board
  makeInitialBoard(BOARD_HEIGHT, BOARD_LENGTH);

  
/**
 * For future use:
  //initialize letters in the board squares that are usuable

  //initialize the correct words
  const correct_words = ["GOLF","WORK"];

  //update function
  function updateSquare(row, col, value) {

  }
*/

// Store the board in React state
  const [board] = useState<Square[][]>(() =>
    makeInitialBoard(BOARD_HEIGHT, BOARD_LENGTH)
  );



  // Prints the board in console when it changes

  useEffect(() => {
    console.log("Board initialized:");
    console.table(board.map(row => row.map(cell => cell.state)));
    console.log(board);
  }, [board]);
  return <div className="App">Testing</div>;
}

export default App;