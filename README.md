# Slidewise (React | TypeScript)

A sliding-letter puzzle game built with **React + TypeScript + Vite**.  
Players slide letter tiles to form two hidden words

**Play Now:** [https://mbartolotta345.github.io/Slidewise/](https://mbartolotta345.github.io/Slidewise/)

## Overview
**Slidewise** is inspired by word puzzles like *Wordle* and *NYT Connections*!
You start with a 5×4 grid of letter and barrier blocks.

- Select a letter tile then an empty space to slide it, or opt for arrow controls.  
- Rearrange letters to form two valid words (one on the top row and one on the bottom).  
- When both words are correct, the game celebrates your success with a **“Great Job!”** message and freezes the board.
- Continue to the next puzzle or reset!

<p align="center">
  <img src="screenshots/demo2.gif" alt="Slidewise Demo">
</p>

## Features
  
- **Move counter:** tracks the number of slides with a move counter
- **Win detection:** checks for correct words dynamically
- **Keyboard Arrow Functionality:** opt for arrow keys over mouse clicks
- **Accessibility Features:** dark mode and high contrast mode
- **Victory screen:** animated “Great Job!” message
- **Dynamic grid logic:** each square tracks state (`empty`, `filled`, `barrier`)

## Future Iterations

- Add randomized starting boards and difficulties (currently two versions)
- Lose condition with limited amount of slide moves you can use 
- Add sound effects
