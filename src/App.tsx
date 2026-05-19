import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import "./App.css";

type CellState = "empty" | "filled" | "barrier";
type Position = { r: number; c: number };
type Square = {
  state: CellState;
  value: string | null;
};

const BOARD_LENGTH = 4;
const BOARD_HEIGHT = 5;
const TARGET_WORDS = ["GOLF", "WORK"];
const EMPTY_LABEL = "Open space";

const BARRIERS: Position[] = [
  { r: 1, c: 0 },
  { r: 1, c: 2 },
  { r: 1, c: 3 },
  { r: 2, c: 0 },
  { r: 2, c: 3 },
  { r: 3, c: 0 },
  { r: 3, c: 2 },
  { r: 3, c: 3 },
];

const STARTING_LETTERS = [
  { r: 0, c: 0, value: "G" },
  { r: 0, c: 1, value: "L" },
  { r: 0, c: 2, value: "O" },
  { r: 0, c: 3, value: "F" },
  { r: 4, c: 0, value: "O" },
  { r: 4, c: 1, value: "W" },
  { r: 4, c: 2, value: "R" },
  { r: 4, c: 3, value: "K" },
];

const DIRECTIONS = {
  ArrowUp: { r: -1, c: 0 },
  ArrowDown: { r: 1, c: 0 },
  ArrowLeft: { r: 0, c: -1 },
  ArrowRight: { r: 0, c: 1 },
};

const FIRST_CURSOR_POSITION = { r: 0, c: 0 };

function makeCell(state: CellState = "empty", value: string | null = null): Square {
  return { state, value };
}

function makeInitialBoard(): Square[][] {
  const board = Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_LENGTH }, () => makeCell())
  );

  BARRIERS.forEach(({ r, c }) => {
    board[r][c] = makeCell("barrier");
  });

  STARTING_LETTERS.forEach(({ r, c, value }) => {
    board[r][c] = makeCell("filled", value);
  });

  return board;
}

function cloneBoard(board: Square[][]): Square[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function getWord(board: Square[][], row: number): string {
  return board[row].map((cell) => cell.value ?? "").join("");
}

function isSamePosition(a: Position | null, b: Position): boolean {
  return Boolean(a && a.r === b.r && a.c === b.c);
}

function isInside({ r, c }: Position): boolean {
  return r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_LENGTH;
}

function clampPosition({ r, c }: Position): Position {
  return {
    r: Math.min(Math.max(r, 0), BOARD_HEIGHT - 1),
    c: Math.min(Math.max(c, 0), BOARD_LENGTH - 1),
  };
}

function isBarrier(board: Square[][], position: Position): boolean {
  return isInside(position) && board[position.r][position.c].state === "barrier";
}

function getCursorDestination(
  board: Square[][],
  position: Position,
  direction: Position
): Position {
  const nextPosition = clampPosition({
    r: position.r + direction.r,
    c: position.c + direction.c,
  });

  return isBarrier(board, nextPosition) ? position : nextPosition;
}

function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

function canSlide(board: Square[][], from: Position, to: Position): boolean {
  return (
    isInside(to) &&
    isAdjacent(from, to) &&
    board[from.r][from.c].state === "filled" &&
    board[to.r][to.c].state === "empty"
  );
}

function getOpenNeighbors(board: Square[][], position: Position | null): Position[] {
  if (!position) return [];

  return Object.values(DIRECTIONS)
    .map((direction) => ({
      r: position.r + direction.r,
      c: position.c + direction.c,
    }))
    .filter((neighbor) => canSlide(board, position, neighbor));
}

function solveState(board: Square[][]) {
  const topWord = getWord(board, 0);
  const bottomWord = getWord(board, BOARD_HEIGHT - 1);
  const topSolved = TARGET_WORDS.includes(topWord);
  const bottomSolved = TARGET_WORDS.includes(bottomWord);
  const solved =
    (topWord === TARGET_WORDS[0] && bottomWord === TARGET_WORDS[1]) ||
    (topWord === TARGET_WORDS[1] && bottomWord === TARGET_WORDS[0]);

  return { topWord, bottomWord, topSolved, bottomSolved, solved };
}

export default function App() {
  const [board, setBoard] = useState<Square[][]>(() => makeInitialBoard());
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<Position | null>(null);
  const [cursor, setCursor] = useState<Position | null>(null);
  const [history, setHistory] = useState<Square[][][]>([]);
  const [message, setMessage] = useState("");

  const { topWord, bottomWord, topSolved, bottomSolved, solved } = useMemo(
    () => solveState(board),
    [board]
  );

  const openNeighbors = useMemo(
    () => getOpenNeighbors(board, selected),
    [board, selected]
  );

  const moveTile = useCallback((from: Position, to: Position, keepSelected = false) => {
    if (!canSlide(board, from, to) || solved) return;

    const nextBoard = cloneBoard(board);
    nextBoard[to.r][to.c] = { ...nextBoard[from.r][from.c] };
    nextBoard[from.r][from.c] = makeCell();

    setHistory((previous) => [...previous, cloneBoard(board)]);
    setBoard(nextBoard);
    setMoves((currentMoves) => currentMoves + 1);
    setSelected(keepSelected ? to : null);
    setCursor(to);

    setMessage(
      solveState(nextBoard).solved
        ? "Solved. Clean, clever, done."
        : "Slide registered."
    );
  }, [board, solved]);

  function selectCell(position: Position) {
    if (solved) return;

    const cell = board[position.r][position.c];
    const alreadySelected = isSamePosition(selected, position);

    if (cell.state === "barrier") return;

    setCursor(position);

    if (alreadySelected) {
      setSelected(null);
      setMessage("Selection cleared.");
      return;
    }

    if (selected && cell.state === "empty") {
      if (canSlide(board, selected, position)) {
        moveTile(selected, position);
      } else {
        setMessage("That space is out of reach.");
      }
      return;
    }

    if (cell.state === "filled") {
      setSelected(position);
      setMessage("Choose an adjacent opening.");
    }
  }

  function undoMove() {
    if (history.length === 0) return;

    const previousBoard = history[history.length - 1];
    setBoard(cloneBoard(previousBoard));
    setHistory((previous) => previous.slice(0, -1));
    setMoves((currentMoves) => Math.max(0, currentMoves - 1));
    setSelected(null);
    setCursor(null);
    setMessage("Last slide undone.");
  }

  function resetGame() {
    setBoard(makeInitialBoard());
    setMoves(0);
    setSelected(null);
    setCursor(null);
    setHistory([]);
    setMessage("");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }

      if (solved) return;

      if (event.key === "Enter") {
        event.preventDefault();

        if (selected) {
          setSelected(null);
          setCursor(selected);
          setMessage("Tile placed.");
          return;
        }

        const activeCursor = cursor ?? FIRST_CURSOR_POSITION;
        setCursor(activeCursor);

        if (board[activeCursor.r][activeCursor.c].state === "filled") {
          setSelected(activeCursor);
          setMessage("Choose an adjacent opening.");
        }

        return;
      }

      if (!(event.key in DIRECTIONS)) return;

      event.preventDefault();
      const direction = DIRECTIONS[event.key as keyof typeof DIRECTIONS];

      if (!selected) {
        if (!cursor) {
          setCursor(FIRST_CURSOR_POSITION);
          setMessage("");
          return;
        }

        setCursor(
          getCursorDestination(board, cursor, direction)
        );
        setMessage("");
        return;
      }

      const destination = {
        r: selected.r + direction.r,
        c: selected.c + direction.c,
      };

      if (canSlide(board, selected, destination)) {
        moveTile(selected, destination, true);
      } else {
        setMessage("No opening there.");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [board, cursor, moveTile, selected, solved]);

  return (
    <div className="App">
      <header className="topbar">
        <div className="brand-lockup">
          <h1 className="title">Slidewise</h1>
        </div>
        <time className="date">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </time>
      </header>

      <main className="game-shell" aria-label="Slidewise letter puzzle">
        <section className="intro" aria-label="Puzzle summary">
          <p className="kicker">Daily letter slide</p>
          <h2>Arrange the rails into two four-letter words.</h2>
          <p className="subhead">
            Every move matters. The best solve is the one that feels inevitable.
          </p>
        </section>

        <section className="play-area">
          <aside className="score-panel" aria-label="Puzzle status">
            <div className="score-card">
              <span className="score-label">Slides</span>
              <strong>{moves}</strong>
            </div>

            <div className="word-stack" aria-label="Current words">
              <div className={topSolved ? "word-card solved" : "word-card"}>
                <span>Top</span>
                <strong>{topWord}</strong>
              </div>
              <div className={bottomSolved ? "word-card solved" : "word-card"}>
                <span>Bottom</span>
                <strong>{bottomWord}</strong>
              </div>
            </div>

            <div className="controls">
              <button type="button" onClick={undoMove} disabled={history.length === 0}>
                Undo
              </button>
              <button type="button" onClick={resetGame}>
                Reset
              </button>
            </div>
          </aside>

          <div className="board-column">
            <div
              className={solved ? "board solved" : "board"}
              style={{ "--cols": BOARD_LENGTH } as CSSProperties}
              role="grid"
              aria-label="Slidewise board"
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const position = { r, c };
                  const selectedCell = isSamePosition(selected, position);
                  const cursorCell = isSamePosition(cursor, position);
                  const canReceive = openNeighbors.some((neighbor) =>
                    isSamePosition(neighbor, position)
                  );
                  const edgeSolved =
                    (r === 0 && topSolved) ||
                    (r === BOARD_HEIGHT - 1 && bottomSolved);
                  const barrierUp = isBarrier(board, { r: r - 1, c });
                  const barrierRight = isBarrier(board, { r, c: c + 1 });
                  const barrierDown = isBarrier(board, { r: r + 1, c });
                  const barrierLeft = isBarrier(board, { r, c: c - 1 });
                  const className = [
                    "cell",
                    cell.state,
                    barrierUp ? "barrier-up" : "",
                    barrierRight ? "barrier-right" : "",
                    barrierDown ? "barrier-down" : "",
                    barrierLeft ? "barrier-left" : "",
                    cursorCell ? "keyboard-cursor" : "",
                    selectedCell ? "selected" : "",
                    canReceive ? "can-receive" : "",
                    edgeSolved ? "word-solved" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      type="button"
                      key={`${r}-${c}`}
                      className={className}
                      onClick={() => selectCell(position)}
                      disabled={solved || cell.state === "barrier"}
                      role="gridcell"
                      aria-label={
                        cell.state === "filled"
                          ? `Letter ${cell.value}`
                          : cell.state === "empty"
                            ? EMPTY_LABEL
                            : "Blocked square"
                      }
                      aria-pressed={selectedCell}
                    >
                      <span>{cell.value ?? ""}</span>
                    </button>
                  );
                })
              )}
            </div>

            <p className={solved ? "status-message victory" : "status-message"}>
              {message}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
