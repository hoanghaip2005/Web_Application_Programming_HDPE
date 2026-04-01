import { useEffect, useMemo, useState } from "react";
import BoardGrid from "../BoardGrid";
import GameChrome from "../GameChrome";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  formatTime,
  InstructionsPanel,
  ReviewsPanel,
  shouldIgnoreGameHotkeys
} from "./gameHelpers";

const GEMS = [
  "#fb5b77",
  "#ff9a49",
  "#ffd166",
  "#54c47b",
  "#4c84ff",
  "#ff71b3"
];

function getBoardRows(game) {
  return Math.max(3, Number(game.rows) || 20);
}

function getBoardCols(game) {
  return Math.max(3, Number(game.cols) || 20);
}

function randomGem(excluded = []) {
  const options = GEMS.filter((gem) => !excluded.includes(gem));
  return options[Math.floor(Math.random() * options.length)];
}

function createInitialBoard(rows, cols) {
  const board = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const excluded = [];

      if (col >= 2 && board[row * cols + col - 1] === board[row * cols + col - 2]) {
        excluded.push(board[row * cols + col - 1]);
      }

      if (
        row >= 2 &&
        board[(row - 1) * cols + col] === board[(row - 2) * cols + col]
      ) {
        excluded.push(board[(row - 1) * cols + col]);
      }

      board.push(randomGem(excluded));
    }
  }

  return board;
}

function areAdjacent(firstIndex, secondIndex, cols) {
  const firstRow = Math.floor(firstIndex / cols);
  const secondRow = Math.floor(secondIndex / cols);
  const sameRowNeighbor = firstRow === secondRow && Math.abs(firstIndex - secondIndex) === 1;
  const verticalNeighbor = Math.abs(firstIndex - secondIndex) === cols;
  return sameRowNeighbor || verticalNeighbor;
}

function moveSelection(index, rows, cols, action) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  let nextRow = row;
  let nextCol = col;

  if (action === "left") {
    nextCol = Math.max(0, col - 1);
  }

  if (action === "right") {
    nextCol = Math.min(cols - 1, col + 1);
  }

  if (action === "up") {
    nextRow = Math.max(0, row - 1);
  }

  if (action === "down") {
    nextRow = Math.min(rows - 1, row + 1);
  }

  return nextRow * cols + nextCol;
}

function swapCells(board, firstIndex, secondIndex) {
  const nextBoard = [...board];
  [nextBoard[firstIndex], nextBoard[secondIndex]] = [nextBoard[secondIndex], nextBoard[firstIndex]];
  return nextBoard;
}

function findMatches(board, rows, cols) {
  const matches = new Set();

  for (let row = 0; row < rows; row += 1) {
    let start = 0;
    while (start < cols) {
      const index = row * cols + start;
      const gem = board[index];
      let end = start + 1;

      while (end < cols && board[row * cols + end] === gem) {
        end += 1;
      }

      if (gem && end - start >= 3) {
        for (let col = start; col < end; col += 1) {
          matches.add(row * cols + col);
        }
      }

      start = end;
    }
  }

  for (let col = 0; col < cols; col += 1) {
    let start = 0;
    while (start < rows) {
      const index = start * cols + col;
      const gem = board[index];
      let end = start + 1;

      while (end < rows && board[end * cols + col] === gem) {
        end += 1;
      }

      if (gem && end - start >= 3) {
        for (let row = start; row < end; row += 1) {
          matches.add(row * cols + col);
        }
      }

      start = end;
    }
  }

  return matches;
}

function collapseBoard(board, rows, cols) {
  const nextBoard = [...board];

  for (let col = 0; col < cols; col += 1) {
    const column = [];

    for (let row = rows - 1; row >= 0; row -= 1) {
      const index = row * cols + col;
      if (nextBoard[index]) {
        column.push(nextBoard[index]);
      }
    }

    for (let row = rows - 1; row >= 0; row -= 1) {
      const index = row * cols + col;
      nextBoard[index] = column[rows - 1 - row] || randomGem();
    }
  }

  return nextBoard;
}

function resolveBoard(board, rows, cols) {
  let nextBoard = [...board];
  let totalScore = 0;
  let totalCleared = 0;
  let combos = 0;

  while (true) {
    const matches = findMatches(nextBoard, rows, cols);
    if (!matches.size) {
      break;
    }

    combos += 1;
    totalCleared += matches.size;
    totalScore += matches.size * 10 * combos;
    nextBoard = nextBoard.map((gem, index) => (matches.has(index) ? null : gem));
    nextBoard = collapseBoard(nextBoard, rows, cols);
  }

  return {
    board: nextBoard,
    totalScore,
    totalCleared,
    combos
  };
}

function normalizeBoard(boardLike, rows, cols) {
  const expectedLength = rows * cols;

  if (!Array.isArray(boardLike)) {
    return createInitialBoard(rows, cols);
  }

  const nextBoard = boardLike.slice(0, expectedLength);

  while (nextBoard.length < expectedLength) {
    nextBoard.push(randomGem());
  }

  return nextBoard;
}

function buildInitialState(game) {
  const boardRows = getBoardRows(game);
  const boardCols = getBoardCols(game);
  const timeLimitSeconds = Number(game.defaultTimerSeconds) || 180;
  return {
    board: createInitialBoard(boardRows, boardCols),
    selectedIndex: 0,
    activeIndex: null,
    score: 0,
    movesCount: 0,
    timeLeft: timeLimitSeconds,
    timeLimitSeconds,
    hintVisible: false,
    finished: false,
    outcome: null,
    resultSubmitted: false,
    status: "Chon hai o ke nhau de doi cho va tao hang 3."
  };
}

function Match3Game({ game }) {
  const { token } = useAuth();
  const boardRows = getBoardRows(game);
  const boardCols = getBoardCols(game);
  const [state, setState] = useState(() => buildInitialState(game));
  const [reviews, setReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const cells = useMemo(
    () =>
      state.board.map((gem, index) => ({
        style: {
          background: gem || "rgba(255,255,255,0.08)"
        },
        className: state.activeIndex === index ? "is-winning" : ""
      })),
    [state.activeIndex, state.board]
  );

  useEffect(() => {
    api
      .getGameReviews(game.code)
      .then((payload) => setReviews(payload.data.reviews))
      .catch(() => setReviews([]));
  }, [game.code]);

  useEffect(() => {
    if (state.finished) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.finished) {
          return current;
        }

        if (current.timeLeft <= 1) {
          return {
            ...current,
            timeLeft: 0,
            finished: true,
            outcome: "timeout",
            status: "Het gio. Ban dung o muc diem hien tai."
          };
        }

        return {
          ...current,
          timeLeft: current.timeLeft - 1
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.finished]);

  useEffect(() => {
    function onKeyDown(event) {
      if (shouldIgnoreGameHotkeys(event)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setState((current) => ({
          ...current,
          selectedIndex: moveSelection(current.selectedIndex, boardRows, boardCols, "left")
        }));
      }

      if (event.key === "ArrowRight") {
        setState((current) => ({
          ...current,
          selectedIndex: moveSelection(current.selectedIndex, boardRows, boardCols, "right")
        }));
      }

      if (event.key === "ArrowUp") {
        setState((current) => ({
          ...current,
          selectedIndex: moveSelection(current.selectedIndex, boardRows, boardCols, "up")
        }));
      }

      if (event.key === "ArrowDown") {
        setState((current) => ({
          ...current,
          selectedIndex: moveSelection(current.selectedIndex, boardRows, boardCols, "down")
        }));
      }

      if (event.key === "Enter") {
        handleSelect();
      }

      if (event.key.toLowerCase() === "h") {
        setState((current) => ({
          ...current,
          hintVisible: !current.hintVisible
        }));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handleSelect(index = state.selectedIndex) {
    setState((current) => {
      if (current.finished) {
        return current;
      }

      if (current.activeIndex === null) {
        return {
          ...current,
          activeIndex: index,
          selectedIndex: index,
          status: "Da chon o dau tien, chon them o ke nhau."
        };
      }

      if (current.activeIndex === index) {
        return {
          ...current,
          activeIndex: null,
          status: "Da bo chon o hien tai."
        };
      }

      if (!areAdjacent(current.activeIndex, index, boardCols)) {
        return {
          ...current,
          activeIndex: index,
          selectedIndex: index,
          status: "Hai o can ke nhau theo ngang hoac doc."
        };
      }

      const swappedBoard = swapCells(current.board, current.activeIndex, index);
      const matches = findMatches(swappedBoard, boardRows, boardCols);
      if (!matches.size) {
        return {
          ...current,
          activeIndex: null,
          selectedIndex: index,
          movesCount: current.movesCount + 1,
          status: "Doi cho khong tao duoc hang 3, thu lai."
        };
      }

      const resolved = resolveBoard(swappedBoard, boardRows, boardCols);
      const nextScore = current.score + resolved.totalScore;

      return {
        ...current,
        board: resolved.board,
        activeIndex: null,
        selectedIndex: index,
        score: nextScore,
        movesCount: current.movesCount + 1,
        status: `Da xoa ${resolved.totalCleared} o, combo ${resolved.combos}.`
      };
    });
  }

  useEffect(() => {
    if (!token || !state.finished || state.resultSubmitted) {
      return;
    }

    api
      .submitGameResult(token, game.code, {
        boardState: {
          board: state.board
        },
        gameState: {
          selectedIndex: state.selectedIndex,
          activeIndex: state.activeIndex,
          finished: state.finished,
          status: state.status
        },
        finalScore: state.score,
        outcome: state.outcome || "draw",
        durationSeconds: state.timeLimitSeconds - state.timeLeft,
        movesCount: state.movesCount,
        remainingSeconds: state.timeLeft,
        timeLimitSeconds: state.timeLimitSeconds,
        currentTurn: "player",
        opponentType: "solo",
        metadata: {
          source: "frontend"
        }
      })
      .then(() => {
        setResultMessage("Da ghi ket qua match-3 vao database.");
        setState((current) => ({ ...current, resultSubmitted: true }));
      })
      .catch((error) => setResultMessage(error.message));
  }, [
    game.code,
    state.activeIndex,
    state.board,
    state.finished,
    state.movesCount,
    state.outcome,
    state.resultSubmitted,
    state.score,
    state.selectedIndex,
    state.status,
    state.timeLeft,
    state.timeLimitSeconds,
    token
  ]);

  function handleSave() {
    if (!token) {
      setState((current) => ({
        ...current,
        status: "Can dang nhap de save game vao backend."
      }));
      return;
    }

    api
      .postGameSave(token, game.code, {
        boardState: {
          board: state.board
        },
        gameState: {
          selectedIndex: state.selectedIndex,
          activeIndex: state.activeIndex,
          finished: state.finished,
          outcome: state.outcome,
          resultSubmitted: state.resultSubmitted,
          hintVisible: state.hintVisible,
          status: state.status
        },
        score: state.score,
        elapsedSeconds: state.timeLimitSeconds - state.timeLeft,
        remainingSeconds: state.timeLeft
      })
      .then(() =>
        setState((current) => ({
          ...current,
          status: "Da luu match-3 vao backend."
        }))
      )
      .catch((error) =>
        setState((current) => ({
          ...current,
          status: error.message
        }))
      );
  }

  function handleLoad() {
    if (!token) {
      setState((current) => ({
        ...current,
        status: "Can dang nhap de load save tu backend."
      }));
      return;
    }

    api
      .getGameSave(token, game.code)
      .then((payload) => {
        if (!payload.data) {
          setState((current) => ({
            ...current,
            status: "Chua co save nao cho match-3."
          }));
          return;
        }

        setState((current) => ({
          ...current,
          board: normalizeBoard(payload.data.boardState.board, boardRows, boardCols),
          selectedIndex: Math.min(
            Math.max(payload.data.gameState.selectedIndex ?? 0, 0),
            boardRows * boardCols - 1
          ),
          activeIndex: payload.data.gameState.activeIndex ?? null,
          finished: payload.data.gameState.finished ?? false,
          outcome: payload.data.gameState.outcome ?? null,
          resultSubmitted: payload.data.gameState.resultSubmitted ?? false,
          hintVisible: payload.data.gameState.hintVisible ?? false,
          score: payload.data.score ?? current.score,
          timeLeft: payload.data.remainingSeconds ?? current.timeLeft,
          status: payload.data.gameState.status || "Da load match-3 tu backend."
        }));
      })
      .catch((error) =>
        setState((current) => ({
          ...current,
          status: error.message
        }))
      );
  }

  function handleReviewSubmit(payload) {
    if (!token) {
      setReviewMessage("Can dang nhap de gui review.");
      return;
    }

    api
      .postGameReview(token, game.code, {
        ratingValue: payload.rating,
        commentBody: payload.comment
      })
      .then((response) => {
        setReviews(response.data.reviews);
        setReviewMessage("Da gui review.");
      })
      .catch((error) => setReviewMessage(error.message));
  }

  return (
    <GameChrome
      title={game.name}
      description={game.description}
      score={state.score}
      timeLabel={formatTime(state.timeLeft)}
      onSave={handleSave}
      onLoad={handleLoad}
      onReset={() => setState(buildInitialState(game))}
      onHint={() =>
        setState((current) => ({
          ...current,
          hintVisible: !current.hintVisible
        }))
      }
      hintVisible={state.hintVisible}
      sidebar={
        <div className="game-sidebar">
          <InstructionsPanel
            instructions={game.instructions}
            fallbackItems={[
              "Chon o thu nhat, sau do chon o ke nhau de doi cho.",
              "Chi nhung nuoc tao duoc hang 3 moi tinh diem.",
              "Ban se choi den khi het thoi gian quy dinh.",
              "Save/Load va review duoc dong bo voi backend."
            ]}
          />

          <section className="status-banner">
            <strong>Trang thai:</strong> {state.status}
          </section>

          <section className="status-banner">
            <strong>Che do:</strong> Choi het gio de dat diem cao nhat.
          </section>

          {state.hintVisible ? (
            <section className="status-banner">
              Tim cac cap mau co the tao hang ngang hoac doc tu 3 o tro len.
            </section>
          ) : null}

          {resultMessage ? <p className="muted">{resultMessage}</p> : null}
          {reviewMessage ? <p className="muted">{reviewMessage}</p> : null}
          <ReviewsPanel reviews={reviews} onAddReview={handleReviewSubmit} />
        </div>
      }
    >
      <BoardGrid
        rows={boardRows}
        cols={boardCols}
        cells={cells}
        selectedIndex={state.selectedIndex}
        highlightSelection={false}
        matrixScale={1}
        matrixDotSize="0.94rem"
        onCellClick={(index) => {
          setState((current) => ({ ...current, selectedIndex: index }));
          handleSelect(index);
        }}
      />
    </GameChrome>
  );
}

export default Match3Game;
