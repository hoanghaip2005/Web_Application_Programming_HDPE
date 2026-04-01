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

const DRAW_PALETTE = [
  "#fb5b77",
  "#ff9a49",
  "#ffd166",
  "#54c47b",
  "#1ab3a6",
  "#4c84ff",
  "#7561d5",
  "#ff71b3"
];

const DRAW_TOOLS = [
  ...DRAW_PALETTE.map((color, index) => ({
    id: `color-${index + 1}`,
    type: "color",
    label: `Màu ${index + 1}`,
    color
  })),
  {
    id: "eraser",
    type: "erase",
    label: "Tẩy màu",
    color: "rgba(255,255,255,0.16)"
  }
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function indexToPoint(index, cols) {
  return {
    row: Math.floor(index / cols),
    col: index % cols
  };
}

function pointToIndex(row, col, cols) {
  return row * cols + col;
}

function calculateFreeDrawScore(board) {
  const coloredCells = board.filter(Boolean);
  return coloredCells.length + new Set(coloredCells).size * 5;
}

function getCoveragePercent(coloredCells, totalCells) {
  if (!totalCells) {
    return 0;
  }

  return Math.round((coloredCells / totalCells) * 100);
}

function buildInitialState(game) {
  const timeLimitSeconds = Number(game.defaultTimerSeconds) || 300;

  return {
    board: Array.from({ length: game.rows * game.cols }, () => null),
    selectedIndex: 0,
    focusArea: "canvas",
    paletteIndex: 0,
    timeLeft: timeLimitSeconds,
    timeLimitSeconds,
    activeColor: DRAW_PALETTE[0],
    activeTool: "paint",
    hintVisible: false,
    status: "Di chuyển trên bảng vẽ, nhấn lên để mở bảng màu và ENTER để tô.",
    finished: false,
    outcome: null,
    resultSubmitted: false
  };
}

function moveCanvasIndex(index, rows, cols, action) {
  const point = indexToPoint(index, cols);
  let nextRow = point.row;
  let nextCol = point.col;

  if (action === "left") {
    nextCol = Math.max(0, point.col - 1);
  }

  if (action === "right") {
    nextCol = Math.min(cols - 1, point.col + 1);
  }

  if (action === "up") {
    nextRow = Math.max(0, point.row - 1);
  }

  if (action === "down") {
    nextRow = Math.min(rows - 1, point.row + 1);
  }

  return pointToIndex(nextRow, nextCol, cols);
}

function moveSelection(current, action, game) {
  if (current.focusArea === "palette") {
    const lastPaletteIndex = DRAW_TOOLS.length - 1;
    let nextPaletteIndex = current.paletteIndex;

    if (action === "left") {
      nextPaletteIndex = Math.max(0, current.paletteIndex - 1);
    }

    if (action === "right") {
      nextPaletteIndex = Math.min(lastPaletteIndex, current.paletteIndex + 1);
    }

    if (action === "up") {
      nextPaletteIndex = 0;
    }

    if (action === "down") {
      return {
        ...current,
        focusArea: "canvas",
        selectedIndex: pointToIndex(0, clamp(current.paletteIndex, 0, game.cols - 1), game.cols),
        status: "Đã quay lại vùng vẽ."
      };
    }

    return {
      ...current,
      paletteIndex: nextPaletteIndex,
      status: `Đang chọn ${DRAW_TOOLS[nextPaletteIndex].label.toLowerCase()}.`
    };
  }

  const point = indexToPoint(current.selectedIndex, game.cols);

  if (action === "up" && point.row === 0) {
    return {
      ...current,
      focusArea: "palette",
      paletteIndex: clamp(point.col, 0, DRAW_TOOLS.length - 1),
      status: "Đã chuyển lên bảng màu."
    };
  }

  return {
    ...current,
    selectedIndex: moveCanvasIndex(current.selectedIndex, game.rows, game.cols, action),
    status: "Đã di chuyển focus trên bảng vẽ."
  };
}

function applyEnter(current) {
  if (current.focusArea === "palette") {
    const selectedTool = DRAW_TOOLS[current.paletteIndex];

    if (selectedTool.type === "erase") {
      return {
        ...current,
        activeTool: "erase",
        status: "Đã chọn tẩy màu."
      };
    }

    return {
      ...current,
      activeTool: "paint",
      activeColor: selectedTool.color,
      status: `Đã chọn ${selectedTool.label.toLowerCase()}.`
    };
  }

  if (current.finished) {
    return current;
  }

  const nextBoard = [...current.board];
  const previousValue = nextBoard[current.selectedIndex];

  if (current.activeTool === "erase") {
    nextBoard[current.selectedIndex] = null;

    return {
      ...current,
      board: nextBoard,
      status: previousValue ? "Đã xóa màu ở ô đang chọn." : "Ô đang chọn chưa có màu để xóa."
    };
  }

  nextBoard[current.selectedIndex] = current.activeColor;

  return {
    ...current,
    board: nextBoard,
    status:
      previousValue === current.activeColor
        ? "Ô đang chọn đã có đúng màu hiện tại."
        : "Đã tô màu ô đang chọn."
  };
}

function applyBackAction(current, game) {
  if (current.focusArea === "palette") {
    return {
      ...current,
      focusArea: "canvas",
      selectedIndex: pointToIndex(0, clamp(current.paletteIndex, 0, game.cols - 1), game.cols),
      status: "Đã quay lại vùng vẽ."
    };
  }

  if (current.finished) {
    return current;
  }

  const nextBoard = [...current.board];
  const currentValue = nextBoard[current.selectedIndex];

  if (currentValue) {
    nextBoard[current.selectedIndex] = null;
    return {
      ...current,
      board: nextBoard,
      status: "Đã xóa màu ở ô đang focus."
    };
  }

  return {
    ...current,
    focusArea: "palette",
    paletteIndex: clamp(indexToPoint(current.selectedIndex, game.cols).col, 0, DRAW_TOOLS.length - 1),
    status: "Đã chuyển lên bảng màu."
  };
}

function FreeDrawGame({ game }) {
  const { token } = useAuth();
  const [state, setState] = useState(() => buildInitialState(game));
  const [reviews, setReviews] = useState([]);
  const [reviewMessage, setReviewMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const score = useMemo(() => calculateFreeDrawScore(state.board), [state.board]);
  const coloredCells = useMemo(() => state.board.filter(Boolean).length, [state.board]);
  const usedColors = useMemo(() => new Set(state.board.filter(Boolean)).size, [state.board]);
  const selectedPoint = useMemo(
    () => indexToPoint(state.selectedIndex, game.cols),
    [game.cols, state.selectedIndex]
  );
  const coveragePercent = useMemo(
    () => getCoveragePercent(coloredCells, state.board.length),
    [coloredCells, state.board.length]
  );

  const cells = useMemo(
    () =>
      state.board.map((color, index) => {
        const stateClass = color ? "draw-canvas-dot--painted" : "draw-canvas-dot--empty";
        const focusClass =
          index === state.selectedIndex && state.focusArea === "canvas"
            ? " draw-canvas-dot--focus hub-dot--focus"
            : "";

        return {
          className: `hub-dot draw-canvas-dot ${stateClass}${focusClass}`.trim(),
          label: `Ô vẽ ${index + 1}`,
          style: {
            background: color || "rgba(148, 163, 184, 0.16)"
          }
        };
      }),
    [state.board, state.focusArea, state.selectedIndex]
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
            status: "Hết giờ. Phiên vẽ đã được chốt."
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
        event.preventDefault();
        setState((current) => moveSelection(current, "left", game));
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setState((current) => moveSelection(current, "right", game));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setState((current) => moveSelection(current, "up", game));
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setState((current) => moveSelection(current, "down", game));
      }

      if (event.key === "Enter") {
        event.preventDefault();
        setState((current) => applyEnter(current));
      }

      if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        setState((current) => applyBackAction(current, game));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game]);

  useEffect(() => {
    if (!token || !state.finished || state.resultSubmitted) {
      return;
    }

    api
      .submitGameResult(token, game.code, {
        boardState: {
          board: state.board,
          coloredCells
        },
        gameState: {
          activeColor: state.activeColor,
          activeTool: state.activeTool,
          focusArea: state.focusArea,
          paletteIndex: state.paletteIndex,
          selectedIndex: state.selectedIndex,
          finished: state.finished,
          status: state.status
        },
        finalScore: score,
        outcome: state.outcome || "draw",
        durationSeconds: state.timeLimitSeconds - state.timeLeft,
        movesCount: coloredCells,
        remainingSeconds: state.timeLeft,
        timeLimitSeconds: state.timeLimitSeconds,
        currentTurn: "player",
        opponentType: "solo",
        metadata: {
          source: "frontend"
        }
      })
      .then(() => {
        setResultMessage("Đã đồng bộ phiên vẽ vào hệ thống.");
        setState((current) => ({ ...current, resultSubmitted: true }));
      })
      .catch((error) => setResultMessage(error.message));
  }, [
    coloredCells,
    game.code,
    score,
    state.activeColor,
    state.activeTool,
    state.board,
    state.finished,
    state.focusArea,
    state.outcome,
    state.paletteIndex,
    state.resultSubmitted,
    state.selectedIndex,
    state.status,
    state.timeLeft,
    state.timeLimitSeconds,
    token
  ]);

  function handleCanvasClick(index) {
    setState((current) =>
      applyEnter({
        ...current,
        focusArea: "canvas",
        selectedIndex: index
      })
    );
  }

  function handlePaletteClick(index) {
    setState((current) =>
      applyEnter({
        ...current,
        focusArea: "palette",
        paletteIndex: index
      })
    );
  }

  return (
    <GameChrome
      title={game.name}
      score={score}
      timeLabel={formatTime(state.timeLeft)}
      onSave={() => {
        if (!token) {
          setState((current) => ({
            ...current,
            status: "Cần đăng nhập để lưu vào backend."
          }));
          return;
        }

        api
          .postGameSave(token, game.code, {
            boardState: { board: state.board, coloredCells },
            gameState: {
              activeColor: state.activeColor,
              activeTool: state.activeTool,
              focusArea: state.focusArea,
              paletteIndex: state.paletteIndex,
              selectedIndex: state.selectedIndex,
              finished: state.finished,
              outcome: state.outcome,
              resultSubmitted: state.resultSubmitted,
              status: state.status
            },
            score,
            elapsedSeconds: state.timeLimitSeconds - state.timeLeft,
            remainingSeconds: state.timeLeft
          })
          .then(() =>
            setState((current) => ({ ...current, status: "Đã lưu bản vẽ vào backend." }))
          )
          .catch((error) =>
            setState((current) => ({ ...current, status: error.message }))
          );
      }}
      onLoad={() => {
        if (!token) {
          setState((current) => ({
            ...current,
            status: "Cần đăng nhập để tải bản vẽ từ backend."
          }));
          return;
        }

        api
          .getGameSave(token, game.code)
          .then((payload) => {
            if (!payload.data) {
              setState((current) => ({
                ...current,
                status: "Chưa có bản lưu nào cho Bảng Vẽ Tự Do."
              }));
              return;
            }

            setState((current) => ({
              ...current,
              board: payload.data.boardState.board || current.board,
              activeColor: payload.data.gameState.activeColor || current.activeColor,
              activeTool: payload.data.gameState.activeTool || current.activeTool,
              focusArea: payload.data.gameState.focusArea || current.focusArea,
              paletteIndex: payload.data.gameState.paletteIndex ?? current.paletteIndex,
              selectedIndex: payload.data.gameState.selectedIndex ?? current.selectedIndex,
              finished: payload.data.gameState.finished ?? false,
              outcome: payload.data.gameState.outcome ?? null,
              resultSubmitted: payload.data.gameState.resultSubmitted ?? false,
              timeLeft: payload.data.remainingSeconds ?? current.timeLeft,
              status: payload.data.gameState.status || "Đã tải bản vẽ từ backend."
            }));
          })
          .catch((error) =>
            setState((current) => ({ ...current, status: error.message }))
          );
      }}
      onReset={() => setState(buildInitialState(game))}
      onHint={() =>
        setState((current) => ({ ...current, hintVisible: !current.hintVisible }))
      }
      hintVisible={state.hintVisible}
      sidebar={
        <div className="game-sidebar">
          <InstructionsPanel
            instructions={game.instructions}
            fallbackItems={[
              "4 mũi tên: di chuyển focus trên bảng vẽ hoặc bảng màu.",
              "Nhấn lên ở hàng đầu tiên để mở bảng màu, nhấn xuống để quay lại vùng vẽ.",
              "ENTER ở bảng màu để chọn màu hoặc bật tẩy màu.",
              "ENTER ở vùng vẽ để tô ô hiện tại, ESC hoặc Backspace để xóa nhanh ô đang chọn.",
              "Bạn có thể chốt phiên bất kỳ lúc nào hoặc chờ hết giờ."
            ]}
          />

          <section
            className={`draw-region-card ${
              state.focusArea === "palette" ? "is-active" : ""
            }`}
          >
            <div className="draw-region-head">
              <div>
                <p className="eyebrow">Bảng màu</p>
                <strong>
                  {state.focusArea === "palette"
                    ? "Đang focus bảng màu"
                    : "Nhấn lên ở hàng đầu để chuyển vùng"}
                </strong>
              </div>
              <span className="layout-pill">
                {DRAW_TOOLS[state.paletteIndex]?.label || "Công cụ"}
              </span>
            </div>
            <p className="eyebrow">Công cụ vẽ</p>
            <div className="draw-toolbar">
              {DRAW_TOOLS.map((tool, index) => {
                const isActiveTool =
                  (tool.type === "erase" && state.activeTool === "erase") ||
                  (tool.type === "color" &&
                    state.activeTool === "paint" &&
                    state.activeColor === tool.color);
                const isFocused = state.focusArea === "palette" && state.paletteIndex === index;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    className={`draw-tool-button ${
                      isActiveTool ? "is-active" : ""
                    } ${isFocused ? "is-focused" : ""} ${
                      tool.type === "erase" ? "draw-tool-button--erase" : ""
                    }`}
                    style={tool.type === "color" ? { background: tool.color } : undefined}
                    title={tool.label}
                    onClick={() => handlePaletteClick(index)}
                  >
                    {tool.type === "erase" ? "Tẩy" : ""}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="draw-preview">
            <div>
              <p className="eyebrow">Công cụ hiện tại</p>
              <strong>{state.activeTool === "erase" ? "Tẩy màu" : "Tô màu"}</strong>
            </div>
            <div
              className={`draw-preview__swatch ${
                state.activeTool === "erase" ? "draw-preview__swatch--erase" : ""
              }`}
              style={state.activeTool === "paint" ? { background: state.activeColor } : undefined}
            >
              {state.activeTool === "erase" ? "Tẩy" : ""}
            </div>
          </section>

          <section className="draw-stats">
            <article className="draw-stat-card">
              <strong>{coloredCells}</strong>
              <span>Ô đã tô</span>
            </article>
            <article className="draw-stat-card">
              <strong>{usedColors}</strong>
              <span>Màu đã dùng</span>
            </article>
            <article className="draw-stat-card">
              <strong>{coveragePercent}%</strong>
              <span>Độ phủ</span>
            </article>
          </section>

          <section className="sidebar-action-card">
            <p className="eyebrow">Thao tác nhanh</p>
            <div className="sidebar-action-grid">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setState((current) => applyEnter(current))}
                disabled={state.finished}
              >
                Tô ô đang chọn
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setState((current) => applyBackAction(current, game))}
                disabled={state.finished}
              >
                Xóa ô đang chọn
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    finished: true,
                    outcome: "draw",
                    status: "Đã chốt phiên vẽ.",
                    resultSubmitted: false
                  }))
                }
                disabled={state.finished}
              >
                {state.finished ? "Phiên đã chốt" : "Chốt phiên"}
              </button>
            </div>
          </section>

          <section className="status-banner">
            <strong>Trạng thái:</strong> {state.status}
          </section>

          <section className="status-banner">
            <strong>Vùng đang chọn:</strong>{" "}
            {state.focusArea === "palette"
              ? `Bảng màu, focus tại ${DRAW_TOOLS[state.paletteIndex]?.label || "công cụ"}`
              : `Vùng vẽ, ô hàng ${selectedPoint.row + 1} cột ${selectedPoint.col + 1}`}
          </section>

          {state.hintVisible ? (
            <section className="status-banner">
              Bạn có thể tô đè, dùng tẩy để xóa màu cũ, lưu/tải bản vẽ và chốt phiên bất kỳ lúc nào.
            </section>
          ) : null}

          {resultMessage ? <p className="muted">{resultMessage}</p> : null}
          {reviewMessage ? <p className="muted">{reviewMessage}</p> : null}

          <ReviewsPanel
            reviews={reviews}
            onAddReview={(payload) => {
              if (!token) {
                setReviewMessage("Cần đăng nhập để gửi đánh giá.");
                return;
              }

              api
                .postGameReview(token, game.code, {
                  ratingValue: payload.rating,
                  commentBody: payload.comment
                })
                .then((response) => {
                  setReviews(response.data.reviews);
                  setReviewMessage("Đã gửi đánh giá.");
                })
                .catch((error) => setReviewMessage(error.message));
            }}
          />
        </div>
      }
    >
      <section
        className={`draw-canvas-shell ${
          state.focusArea === "canvas" ? "is-active" : ""
        }`}
      >
        <div className="draw-region-head">
          <div>
            <p className="eyebrow">Vùng vẽ</p>
            <strong>
              {state.focusArea === "canvas"
                ? "Đang focus bảng vẽ"
                : "Nhấn xuống từ bảng màu để quay lại vùng vẽ"}
            </strong>
          </div>
          <span className="layout-pill">
            Hàng {selectedPoint.row + 1} · Cột {selectedPoint.col + 1}
          </span>
        </div>

        <BoardGrid
          rows={game.rows}
          cols={game.cols}
          cells={cells}
          className="draw-board-grid"
          selectedIndex={state.focusArea === "canvas" ? state.selectedIndex : -1}
          highlightSelection={state.focusArea === "canvas"}
          matrixScale={1}
          onCellClick={handleCanvasClick}
        />
      </section>
    </GameChrome>
  );
}

export default FreeDrawGame;
