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

const DIRECTIONS = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 }
};

function samePoint(a, b) {
  return a.row === b.row && a.col === b.col;
}

function randomFood(rows, cols, snake) {
  const taken = new Set(snake.map((segment) => `${segment.row}:${segment.col}`));
  const options = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const key = `${row}:${col}`;
      if (!taken.has(key)) {
        options.push({ row, col });
      }
    }
  }

  return options[Math.floor(Math.random() * options.length)] || null;
}

function buildInitialState(game) {
  const rows = game.rows;
  const cols = game.cols;
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);
  const snake = [
    { row: centerRow, col: centerCol + 1 },
    { row: centerRow, col: centerCol },
    { row: centerRow, col: centerCol - 1 }
  ];
  const timeLimitSeconds = Number(game.defaultTimerSeconds) || 180;

  return {
    snake,
    food: randomFood(rows, cols, snake),
    directionKey: "ArrowRight",
    queuedDirectionKey: null,
    running: false,
    finished: false,
    score: 0,
    movesCount: 0,
    timeLeft: timeLimitSeconds,
    timeLimitSeconds,
    hintVisible: false,
    status: "Nhan ENTER de bat dau, dung mui ten de doi huong.",
    outcome: null,
    resultSubmitted: false
  };
}

function SnakeGame({ game }) {
  const { token } = useAuth();
  const [state, setState] = useState(() => buildInitialState(game));
  const [reviews, setReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const head = state.snake[0];
  const selectedIndex = head.row * game.cols + head.col;

  const cells = useMemo(() => {
    const snakeSet = new Set(state.snake.map((segment) => `${segment.row}:${segment.col}`));

    return Array.from({ length: game.rows * game.cols }, (_, index) => {
      const row = Math.floor(index / game.cols);
      const col = index % game.cols;
      const key = `${row}:${col}`;
      const isHead = samePoint({ row, col }, head);
      const isFood = state.food && samePoint({ row, col }, state.food);

      return {
        value: isFood ? "@" : "",
        style: {
          background: isHead
            ? "var(--accent-green)"
            : snakeSet.has(key)
              ? "rgba(84,196,123,0.72)"
              : isFood
                ? "var(--accent-red)"
                : "rgba(255,255,255,0.08)"
        }
      };
    });
  }, [game.cols, game.rows, head, state.food, state.snake]);

  useEffect(() => {
    api
      .getGameReviews(game.code)
      .then((payload) => setReviews(payload.data.reviews))
      .catch(() => setReviews([]));
  }, [game.code]);

  useEffect(() => {
    if (state.finished || !state.running) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.finished || !current.running) {
          return current;
        }

        if (current.timeLeft <= 1) {
          return {
            ...current,
            timeLeft: 0,
            running: false,
            finished: true,
            outcome: "timeout",
            status: "Het gio. Ran dung lai."
          };
        }

        return {
          ...current,
          timeLeft: current.timeLeft - 1
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.finished, state.running]);

  useEffect(() => {
    if (state.finished || !state.running) {
      return undefined;
    }

    const movement = window.setInterval(() => {
      setState((current) => {
        if (current.finished || !current.running) {
          return current;
        }

        const appliedDirectionKey = current.queuedDirectionKey || current.directionKey;
        const direction = DIRECTIONS[appliedDirectionKey];
        const nextHead = {
          row: current.snake[0].row + direction.row,
          col: current.snake[0].col + direction.col
        };

        const hitsWall =
          nextHead.row < 0 ||
          nextHead.row >= game.rows ||
          nextHead.col < 0 ||
          nextHead.col >= game.cols;
        const ateFood = current.food && samePoint(nextHead, current.food);
        const snakeToCheck = ateFood ? current.snake : current.snake.slice(0, -1);
        const hitsSelf = snakeToCheck.some((segment) => samePoint(segment, nextHead));

        if (hitsWall || hitsSelf) {
          return {
            ...current,
            directionKey: appliedDirectionKey,
            queuedDirectionKey: null,
            running: false,
            finished: true,
            outcome: "lose",
            status: "Ran da va cham. Session ket thuc."
          };
        }

        const nextSnake = ateFood
          ? [nextHead, ...current.snake]
          : [nextHead, ...current.snake.slice(0, -1)];
        const nextScore = ateFood ? current.score + 20 : current.score;

        if (nextSnake.length === game.rows * game.cols) {
          return {
            ...current,
            snake: nextSnake,
            directionKey: appliedDirectionKey,
            queuedDirectionKey: null,
            running: false,
            finished: true,
            outcome: "win",
            score: nextScore,
            movesCount: current.movesCount + 1,
            status: "Ban da phu kin toan bo board."
          };
        }

        return {
          ...current,
          snake: nextSnake,
          food: ateFood ? randomFood(game.rows, game.cols, nextSnake) : current.food,
          directionKey: appliedDirectionKey,
          queuedDirectionKey: null,
          score: nextScore,
          movesCount: current.movesCount + 1,
          status: ateFood ? "Da an moi, tiep tuc di chuyen." : current.status
        };
      });
    }, 220);

    return () => window.clearInterval(movement);
  }, [game.cols, game.rows, state.finished, state.running]);

  useEffect(() => {
    function onKeyDown(event) {
      if (shouldIgnoreGameHotkeys(event)) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
      }

      if (event.key === "Enter") {
        setState((current) => {
          if (current.finished) {
            return current;
          }

          return {
            ...current,
            running: !current.running,
            status: current.running ? "Da tam dung snake." : "Snake dang chay."
          };
        });
      }

      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        setState((current) => ({
          ...current,
          hintVisible: !current.hintVisible
        }));
      }

      if (Object.hasOwn(DIRECTIONS, event.key)) {
        event.preventDefault();
        setState((current) => {
          if (
            current.queuedDirectionKey &&
            current.queuedDirectionKey !== current.directionKey
          ) {
            return current;
          }

          const currentDirection = DIRECTIONS[current.directionKey];
          const nextDirection = DIRECTIONS[event.key];
          const isReverse =
            currentDirection.row + nextDirection.row === 0 &&
            currentDirection.col + nextDirection.col === 0;

          if (isReverse) {
            return current;
          }

          return {
            ...current,
            queuedDirectionKey: event.key
          };
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!token || !state.finished || state.resultSubmitted) {
      return;
    }

    api
      .submitGameResult(token, game.code, {
        boardState: {
          snake: state.snake,
          food: state.food
        },
        gameState: {
          directionKey: state.directionKey,
          running: state.running,
          finished: state.finished,
          status: state.status
        },
        finalScore: state.score,
        outcome: state.outcome || "lose",
        durationSeconds: state.timeLimitSeconds - state.timeLeft,
        movesCount: state.movesCount,
        remainingSeconds: state.timeLeft,
        timeLimitSeconds: state.timeLimitSeconds,
        currentTurn: "player",
        opponentType: "solo",
        metadata: {
          snakeLength: state.snake.length
        }
      })
      .then(() => {
        setResultMessage("Da ghi ket qua snake vao database.");
        setState((current) => ({ ...current, resultSubmitted: true }));
      })
      .catch((error) => setResultMessage(error.message));
  }, [
    game.code,
    state.directionKey,
    state.finished,
    state.food,
    state.movesCount,
    state.outcome,
    state.resultSubmitted,
    state.running,
    state.score,
    state.snake,
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
          snake: state.snake,
          food: state.food
        },
        gameState: {
          directionKey: state.directionKey,
          running: state.running,
          finished: state.finished,
          outcome: state.outcome,
          resultSubmitted: state.resultSubmitted,
          status: state.status,
          hintVisible: state.hintVisible
        },
        score: state.score,
        elapsedSeconds: state.timeLimitSeconds - state.timeLeft,
        remainingSeconds: state.timeLeft
      })
      .then(() =>
        setState((current) => ({
          ...current,
          status: "Da luu snake vao backend."
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
            status: "Chua co save nao cho snake."
          }));
          return;
        }

        setState((current) => ({
          ...current,
          snake: payload.data.boardState.snake || current.snake,
          food: payload.data.boardState.food || current.food,
          directionKey: payload.data.gameState.directionKey || current.directionKey,
          queuedDirectionKey: null,
          running: false,
          finished: payload.data.gameState.finished ?? false,
          outcome: payload.data.gameState.outcome ?? null,
          resultSubmitted: payload.data.gameState.resultSubmitted ?? false,
          hintVisible: payload.data.gameState.hintVisible ?? false,
          score: payload.data.score ?? current.score,
          timeLeft: payload.data.remainingSeconds ?? current.timeLeft,
          status: payload.data.gameState.status || "Da load snake tu backend."
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
              "ENTER de bat dau hoac tam dung snake.",
              "Mui ten len/xuong/trai/phai de doi huong di chuyen.",
              "An moi de tang diem, tranh dam vao tuong hoac than ran.",
              "Save/Load va review duoc dong bo voi backend."
            ]}
          />

          <section className="status-banner">
            <strong>Trang thai:</strong> {state.status}
          </section>

          <section className="status-banner">
            <strong>Do dai ran:</strong> {state.snake.length}
          </section>

          {state.hintVisible ? (
            <section className="status-banner">
              Muc tieu la giu ran song cang lau cang tot de tang score va len ranking.
            </section>
          ) : null}

          {resultMessage ? <p className="muted">{resultMessage}</p> : null}
          {reviewMessage ? <p className="muted">{reviewMessage}</p> : null}
          <ReviewsPanel reviews={reviews} onAddReview={handleReviewSubmit} />
        </div>
      }
    >
      <div className="status-banner">
        <strong>Mode:</strong> {state.running ? "Dang chay" : "Tam dung"}
      </div>

      <BoardGrid
        rows={game.rows}
        cols={game.cols}
        cells={cells}
        selectedIndex={selectedIndex}
        highlightSelection={false}
        matrixScale={1}
        size="small"
      />
    </GameChrome>
  );
}

export default SnakeGame;
