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

function createEmptyBoard(size) {
  return Array.from({ length: size }, () => null);
}

function getWinningLine(board, rows, cols, winLength, symbol) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const startIndex = row * cols + col;
      if (board[startIndex] !== symbol) continue;

      for (const [dr, dc] of directions) {
        const line = [startIndex];

        for (let step = 1; step < winLength; step += 1) {
          const nextRow = row + dr * step;
          const nextCol = col + dc * step;

          if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
            break;
          }

          const nextIndex = nextRow * cols + nextCol;
          if (board[nextIndex] !== symbol) {
            break;
          }

          line.push(nextIndex);
        }

        if (line.length === winLength) {
          return line;
        }
      }
    }
  }

  return null;
}

function buildInitialState(game) {
  const size = game.rows * game.cols;
  const baseSeconds =
    Number(game.defaultTimerSeconds) ||
    (game.code === "tictactoe" ? 180 : game.code === "caro4" ? 300 : 600);

  return {
    board: createEmptyBoard(size),
    selectedIndex: 0,
    score: 0,
    timeLeft: baseSeconds,
    timeLimitSeconds: baseSeconds,
    isPlayerTurn: true,
    status: "Luot cua ban. Dung Left/Right de chon o, ENTER de danh.",
    hintVisible: false,
    winningLine: [],
    finished: false
    ,
    outcome: null,
    movesCount: 0,
    resultSubmitted: false
  };
}

function normalizeSavedBoard(boardLike, fallbackLength) {
  if (!Array.isArray(boardLike)) {
    return null;
  }

  if (boardLike.length === fallbackLength) {
    return boardLike;
  }

  if (boardLike.length < fallbackLength) {
    return [
      ...boardLike,
      ...Array.from({ length: fallbackLength - boardLike.length }, () => null)
    ];
  }

  return boardLike.slice(0, fallbackLength);
}

function LineGame({ game }) {
  const { token } = useAuth();
  const [state, setState] = useState(() => buildInitialState(game));
  const [reviews, setReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const cellData = useMemo(
    () =>
      state.board.map((value, index) => {
        const isSelectedPreview =
          game.code === "tictactoe" &&
          !value &&
          state.isPlayerTurn &&
          !state.finished &&
          index === state.selectedIndex;

        return {
          value:
            value === "X"
              ? "X"
              : value === "O"
                ? "O"
                : isSelectedPreview
                  ? "X"
                  : "",
          className: [
            state.winningLine.includes(index) ? "is-winning" : "",
            isSelectedPreview ? "hub-dot hub-dot--focus line-game-cell--preview" : ""
          ]
            .filter(Boolean)
            .join(" "),
          style: {
            background:
              value === "X"
                ? "var(--accent-blue)"
                : value === "O"
                  ? "var(--accent-red)"
                  : isSelectedPreview
                    ? "rgba(76, 132, 255, 0.28)"
                    : "rgba(255,255,255,0.08)"
          }
        };
      }),
    [game.code, state.board, state.finished, state.isPlayerTurn, state.selectedIndex, state.winningLine]
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
        if (current.finished) return current;
        if (current.timeLeft <= 1) {
          return {
            ...current,
            timeLeft: 0,
            finished: true,
            status: "Het gio. Session ket thuc.",
            score: 0,
            outcome: "timeout"
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
    if (state.finished || state.isPlayerTurn) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setState((current) => {
        const availableIndexes = current.board
          .map((value, index) => (value ? null : index))
          .filter((value) => value !== null);

        if (availableIndexes.length === 0 || current.finished) {
          return current;
        }

        const pickedIndex =
          availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
        const nextBoard = [...current.board];
        nextBoard[pickedIndex] = "O";

        const winningLine = getWinningLine(
          nextBoard,
          game.rows,
          game.cols,
          game.winLength,
          "O"
        );

        if (winningLine) {
          return {
            ...current,
            board: nextBoard,
            winningLine,
            finished: true,
            status: "Computer thang. Ban co the Reset hoac Load lai.",
            score: 10,
            outcome: "lose",
            movesCount: current.movesCount + 1
          };
        }

        if (nextBoard.every(Boolean)) {
          return {
            ...current,
            board: nextBoard,
            finished: true,
            status: "Van dau hoa.",
            score: 40,
            outcome: "draw",
            movesCount: current.movesCount + 1
          };
        }

        return {
          ...current,
          board: nextBoard,
          isPlayerTurn: true,
          status: "Computer da danh xong. Den luot ban.",
          movesCount: current.movesCount + 1
        };
      });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [game.cols, game.rows, game.winLength, state.finished, state.isPlayerTurn]);

  useEffect(() => {
    function onKeyDown(event) {
      if (shouldIgnoreGameHotkeys(event)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setState((current) => ({
          ...current,
          selectedIndex:
            (current.selectedIndex - 1 + current.board.length) % current.board.length
        }));
      }

      if (event.key === "ArrowRight") {
        setState((current) => ({
          ...current,
          selectedIndex: (current.selectedIndex + 1) % current.board.length
        }));
      }

      if (event.key === "ArrowUp") {
        setState((current) => ({
          ...current,
          selectedIndex:
            (current.selectedIndex - game.cols + current.board.length) %
            current.board.length
        }));
      }

      if (event.key === "ArrowDown") {
        setState((current) => ({
          ...current,
          selectedIndex: (current.selectedIndex + game.cols) % current.board.length
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
      if (current.finished || !current.isPlayerTurn || current.board[index]) {
        return current;
      }

      const nextBoard = [...current.board];
      nextBoard[index] = "X";

      const winningLine = getWinningLine(
        nextBoard,
        game.rows,
        game.cols,
        game.winLength,
        "X"
      );

      if (winningLine) {
        return {
          ...current,
          board: nextBoard,
          winningLine,
          finished: true,
          status: "Ban thang! Computer chi random nuoc di hop le.",
          score: 100,
          outcome: "win",
          movesCount: current.movesCount + 1
        };
      }

      if (nextBoard.every(Boolean)) {
        return {
          ...current,
          board: nextBoard,
          finished: true,
          status: "Van dau hoa.",
          score: 40,
          outcome: "draw",
          movesCount: current.movesCount + 1
        };
      }

      return {
        ...current,
        board: nextBoard,
        isPlayerTurn: false,
        status: "Computer dang tinh nuoc di hop le...",
        movesCount: current.movesCount + 1
      };
    });
  }

  useEffect(() => {
    if (!token || !state.finished || state.resultSubmitted || !state.outcome) {
      return;
    }

    api
      .submitGameResult(token, game.code, {
        boardState: {
          board: state.board,
          winningLine: state.winningLine
        },
        gameState: {
          selectedIndex: state.selectedIndex,
          isPlayerTurn: state.isPlayerTurn,
          finished: state.finished,
          status: state.status
        },
        finalScore: state.score,
        outcome: state.outcome,
        durationSeconds: state.timeLimitSeconds - state.timeLeft,
        movesCount: state.movesCount,
        remainingSeconds: state.timeLeft,
        timeLimitSeconds: state.timeLimitSeconds,
        currentTurn: state.isPlayerTurn ? "player" : "computer",
        metadata: {
          source: "frontend"
        }
      })
      .then(() => {
        setResultMessage("Da dong bo ket qua vao ranking va achievement.");
        setState((current) => ({ ...current, resultSubmitted: true }));
      })
      .catch((error) => setResultMessage(error.message));
  }, [
    game.code,
    state.board,
    state.finished,
    state.isPlayerTurn,
    state.movesCount,
    state.outcome,
    state.resultSubmitted,
    state.score,
    state.selectedIndex,
    state.status,
    state.timeLeft,
    state.timeLimitSeconds,
    state.winningLine,
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
        boardState: { board: state.board, winningLine: state.winningLine },
        gameState: {
          selectedIndex: state.selectedIndex,
          isPlayerTurn: state.isPlayerTurn,
          finished: state.finished,
          status: state.status,
          outcome: state.outcome,
          movesCount: state.movesCount,
          resultSubmitted: state.resultSubmitted
        },
        score: state.score,
        elapsedSeconds: state.timeLimitSeconds - state.timeLeft,
        remainingSeconds: state.timeLeft
      })
      .then(() =>
        setState((current) => ({
          ...current,
          status: "Da save game vao backend."
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
            status: "Chua co save nao cho game nay."
          }));
          return;
        }

        const save = payload.data;

        setState((current) => ({
          ...current,
          board:
            normalizeSavedBoard(save.boardState.board, current.board.length) ||
            normalizeSavedBoard(save.boardState.cells, current.board.length) ||
            current.board,
          winningLine: save.boardState.winningLine || [],
          selectedIndex: save.gameState.selectedIndex ?? current.selectedIndex,
          isPlayerTurn:
            save.gameState.isPlayerTurn ??
            (save.gameState.currentTurn ? save.gameState.currentTurn === "player" : true),
          finished: save.gameState.finished ?? false,
          status: save.gameState.status || "Da load save tu backend.",
          outcome: save.gameState.outcome ?? null,
          movesCount: save.gameState.movesCount ?? 0,
          resultSubmitted: save.gameState.resultSubmitted ?? false,
          score: save.score || 0,
          timeLeft: save.remainingSeconds ?? current.timeLeft
        }));
      })
      .catch((error) =>
        setState((current) => ({
          ...current,
          status: error.message
        }))
      );
  }

  function handleReset() {
    setState(buildInitialState(game));
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
      onReset={handleReset}
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
              "Left / Right de di chuyen focus tren board.",
              "ENTER de dat quan vao o trong dang focus.",
              "Hint/Help de mo lai huong dan va dieu kien thang.",
              "Computer di ngau nhien tren o hop le."
            ]}
          />

          {state.hintVisible ? (
            <section className="status-banner">
              Can tao {game.winLength} quan lien tiep ngang, doc hoac cheo de thang.
            </section>
          ) : null}

          <section className="status-banner">
            <strong>Trang thai:</strong> {state.status}
          </section>

          {resultMessage ? <p className="muted">{resultMessage}</p> : null}
          {reviewMessage ? <p className="muted">{reviewMessage}</p> : null}
          <ReviewsPanel reviews={reviews} onAddReview={handleReviewSubmit} />
        </div>
      }
    >
      <BoardGrid
        rows={game.rows}
        cols={game.cols}
        cells={cellData}
        selectedIndex={state.selectedIndex}
        highlightSelection={false}
        matrixScale={game.code === "tictactoe" ? 4 : game.code === "caro4" ? 2 : 1}
        onCellClick={(index) => {
          setState((current) => ({ ...current, selectedIndex: index }));
          handleSelect(index);
        }}
      />
    </GameChrome>
  );
}

export default LineGame;
