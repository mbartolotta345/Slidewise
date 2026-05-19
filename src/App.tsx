import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import "./App.css";

type CellState = "empty" | "filled" | "barrier";
type Position = { r: number; c: number };
type Square = {
  state: CellState;
  value: string | null;
};
type StartingLetter = Position & { value: string };
type Puzzle = {
  id: string;
  targetWords: [string, string];
  barriers: Position[];
  startingLetters: StartingLetter[];
};
type Theme = "light" | "dark" | "contrast";

const BOARD_LENGTH = 4;
const BOARD_HEIGHT = 5;
const EMPTY_LABEL = "Open space";

const PUZZLES: Puzzle[] = [
  {
    id: "golf-work",
    targetWords: ["GOLF", "WORK"],
    barriers: [
      { r: 1, c: 0 },
      { r: 1, c: 2 },
      { r: 1, c: 3 },
      { r: 2, c: 0 },
      { r: 2, c: 3 },
      { r: 3, c: 0 },
      { r: 3, c: 2 },
      { r: 3, c: 3 },
    ],
    startingLetters: [
      { r: 0, c: 0, value: "G" },
      { r: 0, c: 1, value: "L" },
      { r: 0, c: 2, value: "O" },
      { r: 0, c: 3, value: "F" },
      { r: 4, c: 0, value: "O" },
      { r: 4, c: 1, value: "W" },
      { r: 4, c: 2, value: "R" },
      { r: 4, c: 3, value: "K" },
    ],
  },
  {
    id: "star-moon",
    targetWords: ["STAR", "MOON"],
    barriers: [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 2, c: 2 },
      { r: 3, c: 1 },
      { r: 3, c: 2 },
    ],
    startingLetters: [
      { r: 0, c: 0, value: "T" },
      { r: 0, c: 1, value: "S" },
      { r: 0, c: 2, value: "A" },
      { r: 0, c: 3, value: "R" },
      { r: 4, c: 0, value: "M" },
      { r: 4, c: 1, value: "O" },
      { r: 4, c: 2, value: "N" },
      { r: 4, c: 3, value: "O" },
    ],
  },
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

function makeInitialBoard(puzzle: Puzzle): Square[][] {
  const board = Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_LENGTH }, () => makeCell())
  );

  puzzle.barriers.forEach(({ r, c }) => {
    board[r][c] = makeCell("barrier");
  });

  puzzle.startingLetters.forEach(({ r, c, value }) => {
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

function solveState(board: Square[][], targetWords: [string, string]) {
  const topWord = getWord(board, 0);
  const bottomWord = getWord(board, BOARD_HEIGHT - 1);
  const topSolved = targetWords.includes(topWord);
  const bottomSolved = targetWords.includes(bottomWord);
  const solved =
    (topWord === targetWords[0] && bottomWord === targetWords[1]) ||
    (topWord === targetWords[1] && bottomWord === targetWords[0]);

  return { topWord, bottomWord, topSolved, bottomSolved, solved };
}

function blurActiveCell() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

export default function App() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const activePuzzle = PUZZLES[puzzleIndex];
  const [board, setBoard] = useState<Square[][]>(() => makeInitialBoard(activePuzzle));
  const [selected, setSelected] = useState<Position | null>(null);
  const [cursor, setCursor] = useState<Position | null>(null);
  const [history, setHistory] = useState<Square[][][]>([]);
  const [message, setMessage] = useState("");
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<Set<string>>(
    () => new Set()
  );
  const [showTitleCard, setShowTitleCard] = useState(true);
  const [titleCardLeaving, setTitleCardLeaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>("light");
  const [textScale, setTextScale] = useState(1);

  const { topSolved, bottomSolved, solved } = useMemo(
    () => solveState(board, activePuzzle.targetWords),
    [activePuzzle.targetWords, board]
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
    setSelected(keepSelected ? to : null);
    setCursor(to);
    blurActiveCell();

    const nextSolved = solveState(nextBoard, activePuzzle.targetWords).solved;

    if (nextSolved) {
      setCompletedPuzzleIds((previous) => {
        const nextCompleted = new Set(previous);
        nextCompleted.add(activePuzzle.id);
        return nextCompleted;
      });
    }

    setMessage(nextSolved ? "Solved. Clean, clever, done." : "");
  }, [activePuzzle.id, activePuzzle.targetWords, board, solved]);

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
      setMessage("Choose an open tile");
    }
  }

  function undoMove() {
    if (history.length === 0) return;

    const previousBoard = history[history.length - 1];
    setBoard(cloneBoard(previousBoard));
    setHistory((previous) => previous.slice(0, -1));
    setSelected(null);
    setCursor(null);
    setMessage("Last slide undone.");
  }

  function resetGame() {
    setBoard(makeInitialBoard(activePuzzle));
    setSelected(null);
    setCursor(null);
    setHistory([]);
    setMessage("");
  }

  function openPuzzle(nextPuzzleIndex: number) {
    const nextPuzzle = PUZZLES[nextPuzzleIndex];

    if (!nextPuzzle) return;

    setPuzzleIndex(nextPuzzleIndex);
    setBoard(makeInitialBoard(nextPuzzle));
    setSelected(null);
    setCursor(null);
    setHistory([]);
    setMessage("");
  }

  function startGame() {
    setTitleCardLeaving(true);
    window.setTimeout(() => {
      setShowTitleCard(false);
    }, 360);
  }

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const appClassName = ["App", `theme-${theme}`].join(" ");

  useEffect(() => {
    document.body.style.overflow = showTitleCard ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [showTitleCard]);

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
          setMessage("Choose an open tile");
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
    <div
      className={appClassName}
      style={{ "--text-scale": textScale } as CSSProperties}
    >
      <header className="topbar">
        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="brand-lockup">
          <div className="title-row">
            <h1 className="title">Slidewise</h1>
            <time className="date">{formattedDate}</time>
          </div>
          <p className="creator">Created by Michelle Bartolotta</p>
        </div>
      </header>

      <div
        className={menuOpen ? "menu-scrim open" : "menu-scrim"}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={menuOpen ? "settings-drawer open" : "settings-drawer"}>
        <div className="drawer-header">
          <h2>Menu</h2>
          <button
            type="button"
            className="drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        <div className="drawer-row">
          <span>Dark Mode</span>
          <button
            type="button"
            className={theme === "dark" ? "toggle on" : "toggle"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-pressed={theme === "dark"}
          >
            <span />
          </button>
        </div>

        <section className="drawer-section">
          <button
            type="button"
            className="section-toggle"
            onClick={() => setAccessibilityOpen((open) => !open)}
            aria-expanded={accessibilityOpen}
          >
            <span>Accessibility Settings</span>
            <span aria-hidden="true">{accessibilityOpen ? "-" : "+"}</span>
          </button>

          {accessibilityOpen && (
            <div className="accessibility-panel">
              <div className="drawer-row">
                <span>High Contrast Mode</span>
                <button
                  type="button"
                  className={theme === "contrast" ? "toggle on" : "toggle"}
                  onClick={() =>
                    setTheme(theme === "contrast" ? "light" : "contrast")
                  }
                  aria-pressed={theme === "contrast"}
                >
                  <span />
                </button>
              </div>

              <label className="text-size-control">
                <span>Text Size</span>
                <input
                  type="range"
                  min="0.9"
                  max="1.25"
                  step="0.05"
                  value={textScale}
                  onChange={(event) => setTextScale(Number(event.target.value))}
                />
              </label>
            </div>
          )}
        </section>
      </aside>

      <main className="game-shell" aria-label="Slidewise letter puzzle">
        {showTitleCard && (
          <section
            className={titleCardLeaving ? "title-card leaving" : "title-card"}
            aria-label="Slidewise start"
          >
            <div className="title-card-content">
              <h2>Slidewise</h2>
              <p className="title-card-tagline">Slide to create two four-letter words.</p>
              <button type="button" onClick={startGame}>
                Play
              </button>
              <div className="title-card-meta-group">
                <p className="title-card-date">{formattedDate}</p>
                <p className="title-card-credit">Created by Michelle Bartolotta</p>
              </div>
            </div>
          </section>
        )}

        <section className="play-area">
          <aside className="score-panel" aria-label="Puzzle status">
            <div className="instructions-card" aria-label="Instructions">
              <p>Click tiles or use arrow keys + Enter.</p>
            </div>

            <div className="score-card">
              <span className="score-label">Puzzles Completed</span>
              <strong>
                {completedPuzzleIds.size}/{PUZZLES.length}
              </strong>
            </div>

            <div className="answer-card" aria-label="Words to find">
              <strong>{activePuzzle.targetWords.join(" / ")}</strong>
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

            <div className="puzzle-nav">
              {puzzleIndex === 0 ? (
                <button type="button" onClick={() => openPuzzle(1)}>
                  Next Puzzle
                </button>
              ) : (
                <button type="button" onClick={() => openPuzzle(0)}>
                  Back
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
