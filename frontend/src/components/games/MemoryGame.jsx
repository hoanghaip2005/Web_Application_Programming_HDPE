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

const SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

function getBoardRows(game) {
  return Math.max(2, Number(game.rows) || 4);
}

function getBoardCols(game) {
  return Math.max(2, Number(game.cols) || 4);
}

function getPairCount(game) {
  return Math.floor((getBoardRows(game) * getBoardCols(game)) / 2);
}

function shuffle(items) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function buildDeck(game) {
  const pairCount = getPairCount(game);
  const pairs = Array.from({ length: pairCount }, (_, index) => SYMBOLS[index] || `P${index + 1}`);
  return shuffle(pairs.flatMap((symbol) => [symbol, symbol]));
}

function filterValidIndexes(indexes, maxLength) {
  if (!Array.isArray(indexes)) {
    return [];
  }

  return indexes.filter(
    (index) => Number.isInteger(index) && index >= 0 && index < maxLength
  );
}

function normalizeCards(cardsLike, game) {
  const expectedLength = getBoardRows(game) * getBoardCols(game);

  if (!Array.isArray(cardsLike) || cardsLike.length !== expectedLength) {
    return buildDeck(game);
  }

  return cardsLike;
}

function buildInitialState(game) {
  const timeLimitSeconds = Number(game.defaultTimerSeconds) || 180;

  return {
    cards: buildDeck(game),
    selectedIndex: 0,
    flippedIndexes: [],
    matchedIndexes: [],
    busy: false,
    score: 0,
    movesCount: 0,
    timeLeft: timeLimitSeconds,
    timeLimitSeconds,
    hintVisible: false,
    finished: false,
    outcome: null,
    resultSubmitted: false,
    status: "Lat hai the giong nhau de ghi diem."
  };
}

function MemoryGame({ game }) {
  const { token } = useAuth();
  const boardRows = getBoardRows(game);
  const boardCols = getBoardCols(game);
  const totalPairs = getPairCount(game);
  const [state, setState] = useState(() => buildInitialState(game));
  const [reviews, setReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const cells = useMemo(
    () =>
      state.cards.map((symbol, index) => {
        const row = Math.floor(index / boardCols);
        const col = index % boardCols;
        const isDarkTile = (row + col) % 2 === 1;
        const isMatched = state.matchedIndexes.includes(index);
        const visible =
          state.flippedIndexes.includes(index) || isMatched;

        return {
          value: visible ? symbol : "?",
          style: {
            color: isMatched
              ? "rgba(244, 255, 251, 0.96)"
              : visible
                ? "rgba(27, 38, 58, 0.92)"
                : "rgba(255, 255, 255, 0.9)"
          },
          className: [
            "memory-card",
            isDarkTile ? "memory-card--dark" : "memory-card--light",
            visible ? "memory-card--face-up" : "memory-card--face-down",
            isMatched ? "memory-card--matched" : ""
          ]
            .filter(Boolean)
            .join(" "),
          label: visible
            ? `The ${symbol}`
            : `The an hang ${row + 1}, cot ${col + 1}`
        };
      }),
    [boardCols, state.cards, state.flippedIndexes, state.matchedIndexes]
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
            status: "Het gio. Hay thu lai de lat het cap the."
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
    if (state.flippedIndexes.length !== 2 || !state.busy) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setState((current) => {
        const [firstIndex, secondIndex] = current.flippedIndexes;
        const isMatch = current.cards[firstIndex] === current.cards[secondIndex];

        if (isMatch) {
          const matchedIndexes = [...current.matchedIndexes, firstIndex, secondIndex];
          const didWin = matchedIndexes.length === current.cards.length;

          return {
            ...current,
            flippedIndexes: [],
            matchedIndexes,
            busy: false,
            score: current.score + 25,
            finished: didWin,
            outcome: didWin ? "win" : current.outcome,
            status: didWin ? "Ban da lat het toan bo cap the." : "Da tim thay mot cap moi."
          };
        }

        return {
          ...current,
          flippedIndexes: [],
          busy: false,
          status: "Khong trung cap, hay nho vi tri va thu lai."
        };
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [state.busy, state.flippedIndexes.length]);

  useEffect(() => {
    function onKeyDown(event) {
      if (shouldIgnoreGameHotkeys(event)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setState((current) => ({
          ...current,
          selectedIndex:
            (current.selectedIndex - 1 + current.cards.length) % current.cards.length
        }));
      }

      if (event.key === "ArrowRight") {
        setState((current) => ({
          ...current,
          selectedIndex: (current.selectedIndex + 1) % current.cards.length
        }));
      }

      if (event.key === "ArrowUp") {
        setState((current) => ({
          ...current,
          selectedIndex:
            (current.selectedIndex - boardCols + current.cards.length) % current.cards.length
        }));
      }

      if (event.key === "ArrowDown") {
        setState((current) => ({
          ...current,
          selectedIndex: (current.selectedIndex + boardCols) % current.cards.length
        }));
      }

      if (event.key === "Enter") {
        handleFlip();
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

  function handleFlip(index = state.selectedIndex) {
    setState((current) => {
      if (
        current.finished ||
        current.busy ||
        current.flippedIndexes.includes(index) ||
        current.matchedIndexes.includes(index)
      ) {
        return current;
      }

      const flippedIndexes = [...current.flippedIndexes, index];
      const busy = flippedIndexes.length === 2;

      return {
        ...current,
        selectedIndex: index,
        flippedIndexes,
        busy,
        movesCount: busy ? current.movesCount + 1 : current.movesCount,
        status: busy ? "Dang kiem tra cap the..." : "Da lat the dau tien."
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
          cards: state.cards,
          matchedIndexes: state.matchedIndexes,
          flippedIndexes: state.flippedIndexes
        },
        gameState: {
          selectedIndex: state.selectedIndex,
          busy: state.busy,
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
          matchedPairs: state.matchedIndexes.length / 2
        }
      })
      .then(() => {
        setResultMessage("Da ghi ket qua memory vao database.");
        setState((current) => ({ ...current, resultSubmitted: true }));
      })
      .catch((error) => setResultMessage(error.message));
  }, [
    game.code,
    state.busy,
    state.cards,
    state.finished,
    state.flippedIndexes,
    state.matchedIndexes,
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
          cards: state.cards,
          matchedIndexes: state.matchedIndexes,
          flippedIndexes: state.flippedIndexes
        },
        gameState: {
          selectedIndex: state.selectedIndex,
          busy: state.busy,
          finished: state.finished,
          outcome: state.outcome,
          movesCount: state.movesCount,
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
          status: "Da luu memory game vao backend."
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
            status: "Chua co save nao cho memory."
          }));
          return;
        }

          const baseState = buildInitialState(game);
          const normalizedCards = normalizeCards(payload.data.boardState.cards, game);
          setState({
            ...baseState,
            cards: normalizedCards,
            matchedIndexes: filterValidIndexes(
              payload.data.boardState.matchedIndexes,
              normalizedCards.length
            ),
            flippedIndexes: filterValidIndexes(
              payload.data.boardState.flippedIndexes,
              normalizedCards.length
            ),
            selectedIndex: Math.min(
              Math.max(payload.data.gameState.selectedIndex ?? 0, 0),
              normalizedCards.length - 1
            ),
            busy: payload.data.gameState.busy ?? false,
            finished: payload.data.gameState.finished ?? false,
            outcome: payload.data.gameState.outcome ?? null,
          movesCount: payload.data.gameState.movesCount ?? 0,
          resultSubmitted: payload.data.gameState.resultSubmitted ?? false,
          hintVisible: payload.data.gameState.hintVisible ?? false,
          score: payload.data.score ?? 0,
          timeLeft: payload.data.remainingSeconds ?? baseState.timeLeft,
          status: payload.data.gameState.status || "Da load memory game tu backend."
        });
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
              "Di chuyen focus va ENTER de lat the.",
              "Tim hai the giong nhau de ghi diem va mo khoa cap the.",
              `Hoan thanh tat ca ${totalPairs} cap truoc khi het gio de thang.`,
              "Save/Load va review duoc dong bo voi backend."
            ]}
          />

          <section className="status-banner">
            <strong>Trang thai:</strong> {state.status}
          </section>

          <section className="status-banner">
            <strong>Matched pairs:</strong> {state.matchedIndexes.length / 2} / {totalPairs}
          </section>

          {state.hintVisible ? (
            <section className="status-banner">
              Co gang nho vi tri cac the vua lat khong trung de rut ngan so luot.
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
        className="memory-board-grid"
        variant="standard"
        size="small"
        selectedIndex={state.selectedIndex}
        onCellClick={handleFlip}
      />
    </GameChrome>
  );
}

export default MemoryGame;
