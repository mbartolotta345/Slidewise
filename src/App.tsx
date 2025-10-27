import { useState } from 'react'

import './App.css'

function App() {
  
  //initialize how big the board is
  const BOARD_LENGTH = 4;
  const BOARD_HEIGHT = 5;

  //create a 2d matrix for the board

  let board = Array.from({ length: BOARD_LENGTH }, () => Array(BOARD_HEIGHT).fill(0));

  console.log(board);

  //initialize where the barrier blocks are

  //initialize letters in the board squares that are usuable

  //initialize the correct words
  const correct_words = ["GOLF","WORK"];

  return (
    <>
      
    </>
  )
}

function WordLine({word}) {
  return (
    <div>

    </div>
  )
}

function LetterBox() {
  return (
    <div>
      
    </div>
  )
}
