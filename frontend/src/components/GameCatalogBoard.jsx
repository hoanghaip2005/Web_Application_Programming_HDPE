import { useEffect, useMemo, useRef, useState } from "react";
import BoardGrid from "./BoardGrid";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ReviewsPanel, shouldIgnoreGameHotkeys } from "./games/gameHelpers";

const BOARD_SIZE = 20;

const BASE_DOT_BACKGROUND = "rgba(180, 191, 206, 0.32)";
const LINE_GAME_CODES = new Set(["caro5", "caro4", "tictactoe"]);
const MEMORY_SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const MEMORY_COLORS = [
  "var(--accent-red)",
  "var(--accent-orange)",
  "#ffd166",
  "var(--accent-green)",
  "var(--accent-blue)",
  "var(--accent-pink)",
  "var(--accent-violet)",
  "var(--accent-teal)"
];
const MATCH3_GEMS = [
  "var(--accent-red)",
  "var(--accent-orange)",
  "#ffd166",
  "var(--accent-green)",
  "var(--accent-blue)",
  "var(--accent-pink)"
];
const DRAW_PALETTE = [
  "var(--accent-red)",
  "var(--accent-orange)",
  "#ffd166",
  "var(--accent-green)",
  "var(--accent-teal)",
  "var(--accent-blue)",
  "var(--accent-violet)",
  "var(--accent-pink)"
];
const HUB_FREE_DRAW_ERASER_INDEX = DRAW_PALETTE.length;
const DIRECTION_VECTORS = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 }
};

const HUB_IDLE_DOT = "var(--catalog-idle-dot)";
const HUB_SURFACE_DOT = "var(--catalog-surface-dot)";
const HUB_SURFACE_EDGE_DOT = "var(--catalog-surface-edge-dot)";
const HUB_MEMORY_BACK_DOT = "var(--catalog-memory-back-dot)";
const CATALOG_STORAGE_KEY = "hdpe_catalog_state";

const RING_MASK_3 = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1]
];

const CROSS_MASK_3 = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1]
];

const BLOCK_MASK_3 = [
  [1, 1, 0],
  [1, 1, 0],
  [0, 0, 1]
];

const DIAGONAL_MASK_3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];

const FULL_MASK_3 = [
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1]
];

const RING_MASK_4 = [
  [1, 1, 1, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 1, 1, 1]
];

const CROSS_MASK_4 = [
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [0, 1, 1, 0],
  [1, 0, 0, 1]
];

const DOT_GLYPHS = {
  3: [
    [1, 1, 1],
    [0, 0, 1],
    [0, 1, 1],
    [0, 0, 1],
    [1, 1, 1]
  ],
  4: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1]
  ],
  5: [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1]
  ],
  A: [
    [0, 1, 0],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1]
  ],
  C: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [0, 1, 1]
  ],
  D: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0]
  ],
  E: [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 0],
    [1, 1, 1]
  ],
  G: [
    [0, 1, 1],
    [1, 0, 0],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 1]
  ],
  K: [
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 1]
  ],
  M: [
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1]
  ],
  O: [
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0]
  ],
  N: [
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1]
  ],
  R: [
    [1, 1, 0],
    [1, 0, 1],
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0]
  ],
  T: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0]
  ],
  U: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0]
  ],
  W: [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [1, 0, 1]
  ],
  X: [
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 1]
  ]
};

function wrapIndex(index, length) {
  if (!length) {
    return 0;
  }

  return (index + length) % length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function samePoint(first, second) {
  return first.row === second.row && first.col === second.col;
}

function pointToIndex(row, col, cols) {
  return row * cols + col;
}

function indexToPoint(index, cols) {
  return {
    row: Math.floor(index / cols),
    col: index % cols
  };
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds || 0);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getGameRows(game) {
  return Math.max(1, Number(game?.rows) || Number(game?.defaultBoardRows) || 1);
}

function getGameCols(game) {
  return Math.max(1, Number(game?.cols) || Number(game?.defaultBoardCols) || 1);
}

function getGameTimeLimitSeconds(game) {
  return Math.max(1, Number(game?.defaultTimerSeconds) || 180);
}

function buildMemoryDeck(game) {
  const pairCount = Math.floor((getGameRows(game) * getGameCols(game)) / 2);
  const pairs = Array.from(
    { length: pairCount },
    (_, index) => MEMORY_SYMBOLS[index] || `P${index + 1}`
  );

  return shuffle(pairs.flatMap((symbol) => [symbol, symbol]));
}

function getMemoryCardColor(symbol) {
  const symbolIndex = MEMORY_SYMBOLS.indexOf(symbol);
  const fallbackIndex = Array.from(String(symbol || "")).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  const paletteIndex = symbolIndex >= 0 ? symbolIndex : fallbackIndex;

  return MEMORY_COLORS[paletteIndex % MEMORY_COLORS.length];
}

function filterValidIndexes(indexes, maxLength) {
  if (!Array.isArray(indexes)) {
    return [];
  }

  return indexes.filter(
    (index) => Number.isInteger(index) && index >= 0 && index < maxLength
  );
}

function readStoredCatalogState() {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return {
      selectedGameCode: String(parsed?.selectedGameCode || ""),
      mode: parsed?.mode === "play" ? "play" : "menu",
      helpVisible: Boolean(parsed?.helpVisible)
    };
  } catch {
    return {
      selectedGameCode: "",
      mode: "menu",
      helpVisible: false
    };
  }
}

function createBaseCells() {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => ({
    pattern: "solid",
    label: "Ô board",
    className: "hub-dot hub-dot--ghost",
    style: {
      background: HUB_IDLE_DOT,
      color: "white"
    }
  }));
}

function mergeClassNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function paintCell(cells, row, col, options = {}) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return;
  }

  const index = pointToIndex(row, col, BOARD_SIZE);
  const current = cells[index] || {};

  cells[index] = {
    ...current,
    label: options.label || current.label,
    actionIndex:
      typeof options.actionIndex === "number" ? options.actionIndex : current.actionIndex,
    style: options.background
      ? {
          ...(current.style || {}),
          background: options.background,
          color: "white"
        }
      : current.style,
    className: mergeClassNames(current.className, options.className)
  };
}

function applyMask(cells, startRow, startCol, mask, options = {}) {
  mask.forEach((maskRow, rowOffset) => {
    maskRow.forEach((value, colOffset) => {
      if (!value) {
        return;
      }

      paintCell(cells, startRow + rowOffset, startCol + colOffset, options);
    });
  });
}

function drawLine(cells, coordinates, options = {}) {
  coordinates.forEach(([row, col]) => {
    paintCell(cells, row, col, options);
  });
}

function drawHorizontalDots(cells, row, startCol, endCol, options = {}) {
  for (let col = startCol; col <= endCol; col += 1) {
    paintCell(cells, row, col, options);
  }
}

function drawVerticalDots(cells, col, startRow, endRow, options = {}) {
  for (let row = startRow; row <= endRow; row += 1) {
    paintCell(cells, row, col, options);
  }
}

function drawRectangleOutline(cells, top, left, height, width, options = {}) {
  drawHorizontalDots(cells, top, left, left + width - 1, options);
  drawHorizontalDots(cells, top + height - 1, left, left + width - 1, options);
  drawVerticalDots(cells, left, top, top + height - 1, options);
  drawVerticalDots(cells, left + width - 1, top, top + height - 1, options);
}

function fillRectangle(cells, top, left, height, width, options = {}) {
  for (let row = top; row < top + height; row += 1) {
    for (let col = left; col < left + width; col += 1) {
      paintCell(cells, row, col, options);
    }
  }
}

function drawGlyph(cells, top, left, glyph, options = {}) {
  glyph.forEach((glyphRow, rowOffset) => {
    glyphRow.forEach((value, colOffset) => {
      if (!value) {
        return;
      }

      paintCell(cells, top + rowOffset, left + colOffset, options);
    });
  });
}

function drawWord(cells, word, top, left, options = {}) {
  Array.from(word.toUpperCase()).forEach((character, characterIndex) => {
    const glyph = DOT_GLYPHS[character];
    if (!glyph) {
      return;
    }

    drawGlyph(cells, top, left + characterIndex * 4, glyph, options);
  });
}

function getMenuPresentation(game) {
  if (!game) {
    return {
      title: "GAME",
      suffix: null,
      subtitle: "MODE"
    };
  }

  if (game.code === "caro4") {
    return {
      title: "CARO",
      suffix: "4",
      subtitle: "XO"
    };
  }

  if (game.code === "caro5") {
    return {
      title: "CARO",
      suffix: "5",
      subtitle: "XO"
    };
  }

  if (game.code === "tictactoe") {
    return {
      title: "TTT",
      suffix: null,
      subtitle: "XO"
    };
  }

  if (game.code === "snake") {
    return {
      title: "SNK",
      suffix: null,
      subtitle: "RUN"
    };
  }

  if (game.code === "match3") {
    return {
      title: "M3",
      suffix: null,
      subtitle: "GEM"
    };
  }

  if (game.code === "memory") {
    return {
      title: "MEM",
      suffix: null,
      subtitle: "CARD"
    };
  }

  return {
    title: "DRAW",
    suffix: null,
    subtitle: "ART"
  };
}

function drawMenuArrow(cells, direction) {
  const coordinates =
    direction === "left"
      ? [
          [9, 3],
          [10, 2],
          [11, 1],
          [12, 2],
          [13, 3]
        ]
      : [
          [9, 16],
          [10, 17],
          [11, 18],
          [12, 17],
          [13, 16]
        ];

  drawLine(cells, coordinates, {
    background: "#f7c62f",
    className: "hub-dot hub-dot--blink"
  });
}

function drawMenuIcon(cells, game, hasLeftArrow, hasRightArrow) {
  const presentation = getMenuPresentation(game);
  const titleWidth =
    presentation.title.length * 4 - 1 + (presentation.suffix ? 2 + presentation.suffix.length * 4 - 1 : 0);
  const titleStartCol = Math.max(0, Math.floor((BOARD_SIZE - titleWidth) / 2));
  const subtitleWidth = presentation.subtitle.length * 4 - 1;
  const subtitleStartCol = Math.max(0, Math.floor((BOARD_SIZE - subtitleWidth) / 2));

  drawWord(cells, presentation.title, 1, titleStartCol, {
    background: "var(--accent-red)",
    className: "hub-dot"
  });

  if (presentation.suffix) {
    drawWord(
      cells,
      presentation.suffix,
      1,
      titleStartCol + presentation.title.length * 4 + 1,
      {
        background: "var(--accent-red)",
        className: "hub-dot"
      }
    );
  }

  drawWord(cells, presentation.subtitle, 9, subtitleStartCol, {
    background: "var(--accent-blue)",
    className: "hub-dot"
  });

  if (hasLeftArrow) {
    drawMenuArrow(cells, "left");
  }

  if (hasRightArrow) {
    drawMenuArrow(cells, "right");
  }
}

function drawPager(cells, totalGames, selectedIndex) {
  const totalWidth = totalGames * 2 - 1;
  const startCol = Math.floor((BOARD_SIZE - totalWidth) / 2);

  for (let index = 0; index < totalGames; index += 1) {
    paintCell(cells, 17, startCol + index * 2, {
      background: index === selectedIndex ? "var(--accent-blue)" : "rgba(255,255,255,0.16)",
      className: mergeClassNames("hub-dot", index === selectedIndex ? "hub-dot--selected" : "")
    });
  }
}

function createLineSession(game) {
  return {
    board: Array.from({ length: game.rows * game.cols }, () => null),
    focusIndex: pointToIndex(Math.floor(game.rows / 2), Math.floor(game.cols / 2), game.cols),
    winningLine: [],
    score: 0,
    timeLeft: getGameTimeLimitSeconds(game),
    finished: false,
    outcome: null,
    resultSubmitted: false,
    status: "Dùng 4 mũi tên để di chuyển, ENTER để đặt quân."
  };
}

function createSnakeSession(game) {
  const centerRow = Math.floor(game.rows / 2);
  const centerCol = Math.floor(game.cols / 2);
  const snake = [
    { row: centerRow, col: centerCol + 1 },
    { row: centerRow, col: centerCol },
    { row: centerRow, col: centerCol - 1 }
  ];

  return {
    snake,
    food: randomFood(game.rows, game.cols, snake),
    direction: "right",
    queuedDirection: null,
    running: false,
    score: 0,
    movesCount: 0,
    timeLeft: getGameTimeLimitSeconds(game),
    finished: false,
    outcome: null,
    resultSubmitted: false,
    status: "ENTER để bắt đầu hoặc tạm dừng, 4 mũi tên để đổi hướng."
  };
}

function createMatch3Session(game) {
  return {
    board: createInitialMatch3Board(game.rows, game.cols),
    focusIndex: 0,
    activeIndex: null,
    score: 0,
    movesCount: 0,
    timeLeft: getGameTimeLimitSeconds(game),
    finished: false,
    outcome: null,
    resultSubmitted: false,
    status: "Chọn hai ô kề nhau để đổi chỗ và tạo hàng 3."
  };
}

function createMemorySession(game) {
  return {
    cards: buildMemoryDeck(game),
    focusIndex: 0,
    flippedIndexes: [],
    matchedIndexes: [],
    busy: false,
    score: 0,
    movesCount: 0,
    timeLeft: getGameTimeLimitSeconds(game),
    finished: false,
    outcome: null,
    resultSubmitted: false,
    status: "Lật hai thẻ giống nhau để ghi điểm."
  };
}

function createFreeDrawSession(game) {
  return {
    board: Array.from({ length: getGameRows(game) * getGameCols(game) }, () => null),
    focusIndex: DRAW_PALETTE.length + 1,
    activeColorIndex: 0,
    activeTool: "paint",
    movesCount: 0,
    timeLeft: getGameTimeLimitSeconds(game),
    finished: false,
    outcome: null,
    resultSubmitted: false,
    status: "Di chuyển qua bảng màu hoặc vùng vẽ, ENTER để tô."
  };
}

function createGameSession(game) {
  if (LINE_GAME_CODES.has(game.code)) {
    return createLineSession(game);
  }

  if (game.code === "snake") {
    return createSnakeSession(game);
  }

  if (game.code === "match3") {
    return createMatch3Session(game);
  }

  if (game.code === "memory") {
    return createMemorySession(game);
  }

  return createFreeDrawSession(game);
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

function getWinningLine(board, rows, cols, winLength, symbol) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const startIndex = pointToIndex(row, col, cols);
      if (board[startIndex] !== symbol) {
        continue;
      }

      for (const [rowStep, colStep] of directions) {
        const line = [startIndex];

        for (let step = 1; step < winLength; step += 1) {
          const nextRow = row + rowStep * step;
          const nextCol = col + colStep * step;

          if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
            break;
          }

          const nextIndex = pointToIndex(nextRow, nextCol, cols);
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

  return [];
}

function randomFood(rows, cols, snake) {
  const occupied = new Set(snake.map((segment) => `${segment.row}:${segment.col}`));
  const options = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const key = `${row}:${col}`;
      if (!occupied.has(key)) {
        options.push({ row, col });
      }
    }
  }

  return options[Math.floor(Math.random() * options.length)] || null;
}

function createInitialMatch3Board(rows, cols) {
  const board = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const excluded = [];

      if (col >= 2 && board[pointToIndex(row, col - 1, cols)] === board[pointToIndex(row, col - 2, cols)]) {
        excluded.push(board[pointToIndex(row, col - 1, cols)]);
      }

      if (row >= 2 && board[pointToIndex(row - 1, col, cols)] === board[pointToIndex(row - 2, col, cols)]) {
        excluded.push(board[pointToIndex(row - 1, col, cols)]);
      }

      const options = MATCH3_GEMS.filter((gem) => !excluded.includes(gem));
      board.push(options[Math.floor(Math.random() * options.length)]);
    }
  }

  return board;
}

function areAdjacent(firstIndex, secondIndex, cols) {
  const first = indexToPoint(firstIndex, cols);
  const second = indexToPoint(secondIndex, cols);
  const sameRowNeighbor = first.row === second.row && Math.abs(first.col - second.col) === 1;
  const sameColNeighbor = first.col === second.col && Math.abs(first.row - second.row) === 1;
  return sameRowNeighbor || sameColNeighbor;
}

function swapCells(board, firstIndex, secondIndex) {
  const nextBoard = [...board];
  [nextBoard[firstIndex], nextBoard[secondIndex]] = [nextBoard[secondIndex], nextBoard[firstIndex]];
  return nextBoard;
}

function findMatch3Matches(board, rows, cols) {
  const matches = new Set();

  for (let row = 0; row < rows; row += 1) {
    let start = 0;
    while (start < cols) {
      const gem = board[pointToIndex(row, start, cols)];
      let end = start + 1;

      while (end < cols && board[pointToIndex(row, end, cols)] === gem) {
        end += 1;
      }

      if (gem && end - start >= 3) {
        for (let col = start; col < end; col += 1) {
          matches.add(pointToIndex(row, col, cols));
        }
      }

      start = end;
    }
  }

  for (let col = 0; col < cols; col += 1) {
    let start = 0;
    while (start < rows) {
      const gem = board[pointToIndex(start, col, cols)];
      let end = start + 1;

      while (end < rows && board[pointToIndex(end, col, cols)] === gem) {
        end += 1;
      }

      if (gem && end - start >= 3) {
        for (let row = start; row < end; row += 1) {
          matches.add(pointToIndex(row, col, cols));
        }
      }

      start = end;
    }
  }

  return matches;
}

function collapseMatch3Board(board, rows, cols) {
  const nextBoard = [...board];

  for (let col = 0; col < cols; col += 1) {
    const column = [];

    for (let row = rows - 1; row >= 0; row -= 1) {
      const gem = nextBoard[pointToIndex(row, col, cols)];
      if (gem) {
        column.push(gem);
      }
    }

    for (let row = rows - 1; row >= 0; row -= 1) {
      nextBoard[pointToIndex(row, col, cols)] =
        column[rows - 1 - row] || MATCH3_GEMS[Math.floor(Math.random() * MATCH3_GEMS.length)];
    }
  }

  return nextBoard;
}

function resolveMatch3Board(board, rows, cols) {
  let nextBoard = [...board];
  let totalCleared = 0;
  let combos = 0;

  while (true) {
    const matches = findMatch3Matches(nextBoard, rows, cols);
    if (!matches.size) {
      break;
    }

    combos += 1;
    totalCleared += matches.size;
    nextBoard = nextBoard.map((gem, index) => (matches.has(index) ? null : gem));
    nextBoard = collapseMatch3Board(nextBoard, rows, cols);
  }

  return {
    board: nextBoard,
    totalCleared,
    combos,
    scoreDelta: totalCleared * 10 * Math.max(combos, 1)
  };
}

function shuffle(items) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function calculateFreeDrawScore(board) {
  const coloredCells = board.filter(Boolean);
  return coloredCells.length + new Set(coloredCells).size * 5;
}

function keyToDirection(directionKey) {
  const mapping = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left"
  };

  return mapping[directionKey] || null;
}

function getCurrentScore(session, gameCode) {
  if (!session) {
    return 0;
  }

  if (gameCode === "free-draw") {
    return calculateFreeDrawScore(session.board);
  }

  return session.score || 0;
}

function buildHubSavePayload(game, session) {
  const timeLimitSeconds = getGameTimeLimitSeconds(game);
  const elapsedSeconds = Math.max(0, timeLimitSeconds - (session.timeLeft ?? timeLimitSeconds));

  if (LINE_GAME_CODES.has(game.code)) {
    return {
      boardState: {
        board: session.board,
        winningLine: session.winningLine || []
      },
      gameState: {
        focusIndex: session.focusIndex,
        finished: session.finished,
        outcome: session.outcome,
        resultSubmitted: session.resultSubmitted,
        status: session.status
      },
      score: session.score || 0,
      elapsedSeconds,
      remainingSeconds: session.timeLeft ?? null
    };
  }

  if (game.code === "snake") {
    return {
      boardState: {
        snake: session.snake,
        food: session.food
      },
      gameState: {
        direction: session.direction,
        queuedDirection: session.queuedDirection,
        running: session.running,
        finished: session.finished,
        outcome: session.outcome,
        resultSubmitted: session.resultSubmitted,
        movesCount: session.movesCount ?? 0,
        status: session.status
      },
      score: session.score || 0,
      elapsedSeconds,
      remainingSeconds: session.timeLeft ?? null
    };
  }

  if (game.code === "match3") {
    return {
      boardState: {
        board: session.board
      },
      gameState: {
        focusIndex: session.focusIndex,
        activeIndex: session.activeIndex,
        finished: session.finished,
        outcome: session.outcome,
        resultSubmitted: session.resultSubmitted,
        movesCount: session.movesCount ?? 0,
        status: session.status
      },
      score: session.score || 0,
      elapsedSeconds,
      remainingSeconds: session.timeLeft ?? null
    };
  }

  if (game.code === "memory") {
    return {
      boardState: {
        cards: session.cards,
        matchedIndexes: session.matchedIndexes,
        flippedIndexes: session.flippedIndexes
      },
      gameState: {
        focusIndex: session.focusIndex,
        busy: session.busy,
        finished: session.finished,
        outcome: session.outcome,
        resultSubmitted: session.resultSubmitted,
        movesCount: session.movesCount ?? 0,
        status: session.status
      },
      score: session.score || 0,
      elapsedSeconds,
      remainingSeconds: session.timeLeft ?? null
    };
  }

  return {
    boardState: {
      board: session.board,
      coloredCells: session.board.filter(Boolean).length
    },
    gameState: {
      focusIndex: session.focusIndex,
      activeColorIndex: session.activeColorIndex,
      activeTool: session.activeTool,
      finished: session.finished,
      outcome: session.outcome,
      resultSubmitted: session.resultSubmitted,
      movesCount: session.movesCount ?? 0,
      status: session.status
    },
    score: calculateFreeDrawScore(session.board),
    elapsedSeconds,
    remainingSeconds: session.timeLeft ?? null
  };
}

function buildHubResultPayload(game, session) {
  const timeLimitSeconds = getGameTimeLimitSeconds(game);
  const durationSeconds = Math.max(0, timeLimitSeconds - (session.timeLeft ?? timeLimitSeconds));

  if (LINE_GAME_CODES.has(game.code)) {
    return {
      boardState: {
        board: session.board,
        winningLine: session.winningLine || []
      },
      gameState: {
        focusIndex: session.focusIndex,
        finished: session.finished,
        status: session.status
      },
      finalScore: session.score || 0,
      outcome: session.outcome || "draw",
      durationSeconds,
      movesCount: session.board.filter(Boolean).length,
      remainingSeconds: session.timeLeft ?? null,
      timeLimitSeconds,
      currentTurn: "player",
      opponentType: "computer",
      metadata: {
        source: "catalog-board"
      }
    };
  }

  if (game.code === "snake") {
    return {
      boardState: {
        snake: session.snake,
        food: session.food
      },
      gameState: {
        direction: session.direction,
        finished: session.finished,
        status: session.status
      },
      finalScore: session.score || 0,
      outcome: session.outcome || "lose",
      durationSeconds,
      movesCount: session.movesCount ?? 0,
      remainingSeconds: session.timeLeft ?? null,
      timeLimitSeconds,
      currentTurn: "player",
      opponentType: "solo",
      metadata: {
        source: "catalog-board",
        snakeLength: session.snake.length
      }
    };
  }

  if (game.code === "match3") {
    return {
      boardState: {
        board: session.board
      },
      gameState: {
        focusIndex: session.focusIndex,
        activeIndex: session.activeIndex,
        finished: session.finished,
        status: session.status
      },
      finalScore: session.score || 0,
      outcome: session.outcome || "draw",
      durationSeconds,
      movesCount: session.movesCount ?? 0,
      remainingSeconds: session.timeLeft ?? null,
      timeLimitSeconds,
      currentTurn: "player",
      opponentType: "solo",
      metadata: {
        source: "catalog-board"
      }
    };
  }

  if (game.code === "memory") {
    return {
      boardState: {
        cards: session.cards,
        matchedIndexes: session.matchedIndexes,
        flippedIndexes: session.flippedIndexes
      },
      gameState: {
        focusIndex: session.focusIndex,
        busy: session.busy,
        finished: session.finished,
        status: session.status
      },
      finalScore: session.score || 0,
      outcome: session.outcome || "draw",
      durationSeconds,
      movesCount: session.movesCount ?? 0,
      remainingSeconds: session.timeLeft ?? null,
      timeLimitSeconds,
      currentTurn: "player",
      opponentType: "solo",
      metadata: {
        source: "catalog-board",
        matchedPairs: session.matchedIndexes.length / 2
      }
    };
  }

  return {
    boardState: {
      board: session.board,
      coloredCells: session.board.filter(Boolean).length
    },
    gameState: {
      focusIndex: session.focusIndex,
      activeColorIndex: session.activeColorIndex,
      activeTool: session.activeTool,
      finished: session.finished,
      status: session.status
    },
    finalScore: calculateFreeDrawScore(session.board),
    outcome: session.outcome || "draw",
    durationSeconds,
    movesCount: session.movesCount ?? 0,
    remainingSeconds: session.timeLeft ?? null,
    timeLimitSeconds,
    currentTurn: "player",
    opponentType: "solo",
    metadata: {
      source: "catalog-board"
    }
  };
}

function hydrateFreeDrawFocusIndex(current, gameState) {
  const paletteCount = DRAW_PALETTE.length + 1;
  const maxFocusIndex = paletteCount + current.board.length - 1;

  if (typeof gameState?.focusIndex === "number") {
    return clamp(gameState.focusIndex, 0, maxFocusIndex);
  }

  if (gameState?.focusArea === "palette" && typeof gameState?.paletteIndex === "number") {
    return Math.min(Math.max(gameState.paletteIndex, 0), paletteCount - 1);
  }

  if (
    gameState?.focusArea === "canvas" &&
    typeof gameState?.selectedIndex === "number"
  ) {
    return clamp(paletteCount + gameState.selectedIndex, 0, maxFocusIndex);
  }

  return current.focusIndex;
}

function hydrateHubSession(game, current, save) {
  const boardState = save?.boardState || {};
  const gameState = save?.gameState || {};
  const common = {
    ...current,
    finished: gameState.finished ?? current.finished,
    outcome: gameState.outcome ?? current.outcome,
    resultSubmitted: gameState.resultSubmitted ?? current.resultSubmitted,
    timeLeft: save?.remainingSeconds ?? current.timeLeft,
    status: gameState.status || "Đã tải tiến trình từ backend."
  };

  if (LINE_GAME_CODES.has(game.code)) {
    const normalizedBoard = normalizeSavedBoard(
      boardState.board || boardState.cells,
      current.board.length
    );

    return {
      ...common,
      board: normalizedBoard || current.board,
      winningLine: boardState.winningLine || [],
      focusIndex: gameState.focusIndex ?? gameState.selectedIndex ?? current.focusIndex,
      score: save?.score ?? current.score
    };
  }

  if (game.code === "snake") {
    return {
      ...common,
      snake: boardState.snake || current.snake,
      food: boardState.food || current.food,
      direction:
        gameState.direction || keyToDirection(gameState.directionKey) || current.direction,
      queuedDirection: null,
      running: false,
      score: save?.score ?? current.score,
      movesCount: gameState.movesCount ?? current.movesCount
    };
  }

  if (game.code === "match3") {
    const normalizedBoard = normalizeSavedBoard(boardState.board, current.board.length);

    return {
      ...common,
      board: normalizedBoard || current.board,
      focusIndex: gameState.focusIndex ?? gameState.selectedIndex ?? current.focusIndex,
      activeIndex: gameState.activeIndex ?? current.activeIndex,
      score: save?.score ?? current.score,
      movesCount: gameState.movesCount ?? current.movesCount
    };
  }

  if (game.code === "memory") {
    const nextCards =
      Array.isArray(boardState.cards) && boardState.cards.length === current.cards.length
        ? boardState.cards
        : current.cards;
    const maxCardIndex = nextCards.length;

    return {
      ...common,
      cards: nextCards,
      matchedIndexes: filterValidIndexes(boardState.matchedIndexes, maxCardIndex),
      flippedIndexes: filterValidIndexes(boardState.flippedIndexes, maxCardIndex),
      focusIndex: clamp(
        gameState.focusIndex ?? gameState.selectedIndex ?? current.focusIndex,
        0,
        Math.max(maxCardIndex - 1, 0)
      ),
      busy: false,
      score: save?.score ?? current.score,
      movesCount: gameState.movesCount ?? current.movesCount
    };
  }

  const resolvedActiveColorIndex =
    typeof gameState.activeColorIndex === "number"
      ? gameState.activeColorIndex
      : DRAW_PALETTE.indexOf(gameState.activeColor);
  const normalizedBoard = normalizeSavedBoard(boardState.board, current.board.length);
  const nextBoard = normalizedBoard || current.board;

  return {
    ...common,
    board: nextBoard,
    focusIndex: hydrateFreeDrawFocusIndex(current, gameState),
    activeColorIndex:
      resolvedActiveColorIndex >= 0 ? resolvedActiveColorIndex : current.activeColorIndex,
    activeTool: gameState.activeTool || current.activeTool,
    score: save?.score ?? calculateFreeDrawScore(nextBoard),
    movesCount: gameState.movesCount ?? current.movesCount
  };
}

function hydrateHubSessionFromSave(game, save) {
  return hydrateHubSession(game, createGameSession(game), save);
}

function isPlayableSave(save) {
  if (!save) {
    return false;
  }

  if (save.gameState?.finished) {
    return false;
  }

  if (
    save.remainingSeconds !== undefined &&
    save.remainingSeconds !== null &&
    Number(save.remainingSeconds) <= 0
  ) {
    return false;
  }

  return true;
}

function getViewport(game, focusRow, focusCol) {
  const visibleRows = Math.min(game.rows, BOARD_SIZE);
  const visibleCols = Math.min(game.cols, BOARD_SIZE);
  const boardRowOffset = game.rows > BOARD_SIZE ? 0 : Math.floor((BOARD_SIZE - visibleRows) / 2);
  const boardColOffset = game.cols > BOARD_SIZE ? 0 : Math.floor((BOARD_SIZE - visibleCols) / 2);
  const sourceRow = game.rows > BOARD_SIZE ? clamp(focusRow - Math.floor(BOARD_SIZE / 2), 0, game.rows - BOARD_SIZE) : 0;
  const sourceCol = game.cols > BOARD_SIZE ? clamp(focusCol - Math.floor(BOARD_SIZE / 2), 0, game.cols - BOARD_SIZE) : 0;

  return {
    visibleRows,
    visibleCols,
    boardRowOffset,
    boardColOffset,
    sourceRow,
    sourceCol
  };
}

function moveGridIndex(index, rows, cols, action) {
  const point = indexToPoint(index, cols);
  let nextRow = point.row;
  let nextCol = point.col;

  if (action === "left") {
    nextCol = wrapIndex(point.col - 1, cols);
  }

  if (action === "right") {
    nextCol = wrapIndex(point.col + 1, cols);
  }

  if (action === "up") {
    nextRow = wrapIndex(point.row - 1, rows);
  }

  if (action === "down") {
    nextRow = wrapIndex(point.row + 1, rows);
  }

  return pointToIndex(nextRow, nextCol, cols);
}

function moveGridIndexBounded(index, rows, cols, action) {
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

function moveFreeDrawIndex(index, action, game) {
  const paletteCount = DRAW_PALETTE.length + 1;
  const boardRows = getGameRows(game);
  const boardCols = getGameCols(game);

  if (index < paletteCount) {
    let col = index;

    if (action === "left") {
      col = Math.max(0, col - 1);
    }

    if (action === "right") {
      col = Math.min(paletteCount - 1, col + 1);
    }

    if (action === "down") {
      return paletteCount + col;
    }

    if (action === "up") {
      return col;
    }

    return col;
  }

  const boardIndex = Math.max(0, Math.min(index - paletteCount, boardRows * boardCols - 1));
  const point = indexToPoint(boardIndex, boardCols);
  let nextRow = point.row;
  let nextCol = point.col;

  if (action === "left") {
    nextCol = Math.max(0, point.col - 1);
  }

  if (action === "right") {
    nextCol = Math.min(boardCols - 1, point.col + 1);
  }

  if (action === "up") {
    if (point.row === 0) {
      return Math.min(point.col, paletteCount - 1);
    }

    nextRow = point.row - 1;
  }

  if (action === "down") {
    nextRow = Math.min(boardRows - 1, point.row + 1);
  }

  return paletteCount + nextRow * boardCols + nextCol;
}

function buildMenuCells(games, selectedIndex) {
  const cells = createBaseCells();
  const game = games[selectedIndex] || null;
  drawMenuIcon(cells, game, selectedIndex > 0, selectedIndex < games.length - 1);
  drawPager(cells, games.length, selectedIndex);

  return cells;
}

function buildLineGameCells(game, session) {
  const cells = createBaseCells();

  if (game.code === "tictactoe") {
    const boardTop = 3;
    const boardLeft = 3;
    const cellSize = 4;
    const step = 5;
    const boardExtent = cellSize * 3 + 1 * 2;
    const gridStyle = {
      background: "rgba(10, 12, 18, 0.96)",
      className: "hub-dot hub-dot--frame"
    };

    drawVerticalDots(cells, boardLeft + cellSize, boardTop, boardTop + boardExtent - 1, gridStyle);
    drawVerticalDots(
      cells,
      boardLeft + cellSize + step,
      boardTop,
      boardTop + boardExtent - 1,
      gridStyle
    );
    drawHorizontalDots(cells, boardTop + cellSize, boardLeft, boardLeft + boardExtent - 1, gridStyle);
    drawHorizontalDots(
      cells,
      boardTop + cellSize + step,
      boardLeft,
      boardLeft + boardExtent - 1,
      gridStyle
    );

    for (let index = 0; index < session.board.length; index += 1) {
      const value = session.board[index];
      const { row, col } = indexToPoint(index, game.cols);
      const startRow = boardTop + row * step;
      const startCol = boardLeft + col * step;

      fillRectangle(cells, startRow, startCol, cellSize, cellSize, {
        actionIndex: index,
        label: `Ô ${index + 1}`
      });

      if (!value && index === session.focusIndex) {
        applyMask(cells, startRow, startCol, CROSS_MASK_4, {
          background: "rgba(76, 132, 255, 0.56)",
          className: "hub-dot",
          actionIndex: index,
          label: `Ô ${index + 1}`
        });
      }

      if (!value) {
        continue;
      }

      const mask = value === "X" ? CROSS_MASK_4 : RING_MASK_4;
      applyMask(cells, startRow, startCol, mask, {
        background: value === "X" ? "var(--accent-blue)" : "var(--accent-red)",
        className: mergeClassNames(
          "hub-dot",
          index === session.focusIndex ? "hub-dot--focus" : "",
          session.winningLine.includes(index) ? "hub-dot--winning" : ""
        ),
        actionIndex: index,
        label: `Ô ${index + 1}`
      });
    }

    return cells;
  }

  const focusPoint = indexToPoint(session.focusIndex, game.cols);
  const viewport = getViewport(game, focusPoint.row, focusPoint.col);

  for (let row = 0; row < viewport.visibleRows; row += 1) {
    for (let col = 0; col < viewport.visibleCols; col += 1) {
      const sourceRow = viewport.sourceRow + row;
      const sourceCol = viewport.sourceCol + col;
      const logicalIndex = pointToIndex(sourceRow, sourceCol, game.cols);
      const value = session.board[logicalIndex];

      paintCell(
        cells,
        viewport.boardRowOffset + row,
        viewport.boardColOffset + col,
        {
          background:
            value === "X"
              ? "var(--accent-blue)"
              : value === "O"
                ? "var(--accent-red)"
                : logicalIndex === session.focusIndex
                  ? "rgba(255,255,255,0.42)"
                  : BASE_DOT_BACKGROUND,
          className: mergeClassNames(
            "hub-dot",
            logicalIndex === session.focusIndex ? "hub-dot--focus" : "",
            session.winningLine.includes(logicalIndex) ? "hub-dot--winning" : ""
          ),
          actionIndex: logicalIndex,
          label: `Ô ${sourceRow + 1}:${sourceCol + 1}`
        }
      );
    }
  }

  return cells;
}

function buildSnakeCells(game, session) {
  const cells = createBaseCells();
  const head = session.snake[0];
  const viewport = getViewport(game, head.row, head.col);
  const snakeSet = new Set(session.snake.map((segment) => `${segment.row}:${segment.col}`));

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const sourceRow = viewport.sourceRow + row;
      const sourceCol = viewport.sourceCol + col;

      if (sourceRow >= game.rows || sourceCol >= game.cols) {
        continue;
      }

      const key = `${sourceRow}:${sourceCol}`;
      const isHead = head.row === sourceRow && head.col === sourceCol;
      const isFood = session.food && session.food.row === sourceRow && session.food.col === sourceCol;

      if (!snakeSet.has(key) && !isFood) {
        continue;
      }

      paintCell(cells, row, col, {
        background: isHead
          ? "var(--accent-blue)"
          : isFood
            ? "var(--accent-red)"
            : "var(--accent-green)",
        className: mergeClassNames("hub-dot", isHead ? "hub-dot--focus" : ""),
        label: isFood ? "Mồi" : "Rắn"
      });
    }
  }

  return cells;
}

function buildMatch3Cells(game, session) {
  const cells = createBaseCells();
  const focusPoint = indexToPoint(session.focusIndex, game.cols);
  const viewport = getViewport(game, focusPoint.row, focusPoint.col);

  for (let row = 0; row < viewport.visibleRows; row += 1) {
    for (let col = 0; col < viewport.visibleCols; col += 1) {
      const sourceRow = viewport.sourceRow + row;
      const sourceCol = viewport.sourceCol + col;
      const logicalIndex = pointToIndex(sourceRow, sourceCol, game.cols);

      paintCell(cells, viewport.boardRowOffset + row, viewport.boardColOffset + col, {
        background: session.board[logicalIndex],
        className: mergeClassNames(
          "hub-dot",
          logicalIndex === session.focusIndex ? "hub-dot--focus" : "",
          logicalIndex === session.activeIndex ? "hub-dot--active" : ""
        ),
        actionIndex: logicalIndex,
        label: `Viên ${sourceRow + 1}:${sourceCol + 1}`
      });
    }
  }

  return cells;
}

function buildMemoryCells(game, session) {
  const cells = createBaseCells();
  const focusPoint = indexToPoint(session.focusIndex, game.cols);
  const viewport = getViewport(game, focusPoint.row, focusPoint.col);

  for (let row = 0; row < viewport.visibleRows; row += 1) {
    for (let col = 0; col < viewport.visibleCols; col += 1) {
      const sourceRow = viewport.sourceRow + row;
      const sourceCol = viewport.sourceCol + col;
      const logicalIndex = pointToIndex(sourceRow, sourceCol, game.cols);
      const isMatched = session.matchedIndexes.includes(logicalIndex);
      const isVisible = isMatched || session.flippedIndexes.includes(logicalIndex);

      paintCell(cells, viewport.boardRowOffset + row, viewport.boardColOffset + col, {
        background: isVisible
          ? getMemoryCardColor(session.cards[logicalIndex])
          : HUB_MEMORY_BACK_DOT,
        className: mergeClassNames(
          "hub-dot",
          logicalIndex === session.focusIndex ? "hub-dot--focus" : "",
          isMatched ? "hub-dot--winning" : ""
        ),
        actionIndex: logicalIndex,
        label: isVisible
          ? `Thẻ ${session.cards[logicalIndex]}`
          : `Thẻ ${sourceRow + 1}:${sourceCol + 1}`
      });
    }
  }

  return cells;
}

function buildFreeDrawCells(game, session) {
  const cells = createBaseCells();
  const paletteRow = 1;
  const paletteStartCol = Math.floor((BOARD_SIZE - (DRAW_PALETTE.length + 1)) / 2);
  const canvasStartRow = 4;
  const boardRows = getGameRows(game);
  const boardCols = getGameCols(game);
  const visibleRows = Math.min(boardRows, BOARD_SIZE - canvasStartRow);
  const visibleCols = Math.min(boardCols, BOARD_SIZE);
  const paletteCount = DRAW_PALETTE.length + 1;
  const boardFocusIndex = Math.max(0, Math.min(session.focusIndex - paletteCount, session.board.length - 1));
  const focusPoint = indexToPoint(boardFocusIndex, boardCols);
  const sourceRow =
    boardRows > visibleRows
      ? clamp(focusPoint.row - Math.floor(visibleRows / 2), 0, boardRows - visibleRows)
      : 0;
  const sourceCol =
    boardCols > visibleCols
      ? clamp(focusPoint.col - Math.floor(visibleCols / 2), 0, boardCols - visibleCols)
      : 0;
  const canvasStartCol = boardCols > visibleCols ? 0 : Math.floor((BOARD_SIZE - visibleCols) / 2);
  const boardRowOffset =
    boardRows > visibleRows
      ? canvasStartRow
      : canvasStartRow + Math.floor((BOARD_SIZE - canvasStartRow - visibleRows) / 2);

  [...DRAW_PALETTE, "erase"].forEach((color, colorIndex) => {
    const focusIndex = colorIndex;
    const isEraseTool = color === "erase";
    const isActiveTool =
      (isEraseTool && session.activeTool === "erase") ||
      (!isEraseTool && session.activeTool !== "erase" && session.activeColorIndex === colorIndex);

    paintCell(cells, paletteRow, paletteStartCol + colorIndex, {
      background: isEraseTool ? "rgba(255,255,255,0.16)" : color,
      className: mergeClassNames(
        "hub-dot",
        isActiveTool ? "hub-dot--active" : "",
        session.focusIndex === focusIndex ? "hub-dot--focus" : ""
      ),
      actionIndex: focusIndex,
      label: isEraseTool ? "Tẩy màu" : `Màu ${colorIndex + 1}`
    });
  });

  for (let row = 0; row < visibleRows; row += 1) {
    for (let col = 0; col < visibleCols; col += 1) {
      const logicalRow = sourceRow + row;
      const logicalCol = sourceCol + col;
      const logicalIndex = pointToIndex(logicalRow, logicalCol, boardCols);
      const focusIndex = paletteCount + logicalIndex;

      paintCell(cells, boardRowOffset + row, canvasStartCol + col, {
        background: session.board[logicalIndex] || BASE_DOT_BACKGROUND,
        className: mergeClassNames(
          "hub-dot",
          session.focusIndex === focusIndex ? "hub-dot--focus" : ""
        ),
        actionIndex: focusIndex,
        label: `Ô vẽ ${logicalRow + 1}:${logicalCol + 1}`
      });
    }
  }

  return cells;
}

function buildPlayCells(game, session) {
  if (LINE_GAME_CODES.has(game.code)) {
    return buildLineGameCells(game, session);
  }

  if (game.code === "snake") {
    return buildSnakeCells(game, session);
  }

  if (game.code === "match3") {
    return buildMatch3Cells(game, session);
  }

  if (game.code === "memory") {
    return buildMemoryCells(game, session);
  }

  return buildFreeDrawCells(game, session);
}

function getSessionSummary(game, session, mode) {
  if (mode === "menu" || !session) {
    return {
      score: 0,
      timeLabel: "--:--",
      status: "Dùng Left/Right để chọn game, ENTER để bắt đầu."
    };
  }

  return {
    score: getCurrentScore(session, game.code),
    timeLabel: formatTime(session.timeLeft),
    status: session.status
  };
}

function getHelpItems(game, mode) {
  if (mode === "menu") {
    return [
      "Left: chuyển sang game trước.",
      "Right: chuyển sang game tiếp theo.",
      "Enter: vào chế độ chơi ngay trên board 20 x 20.",
      "Back: giữ nguyên menu tổng.",
      "Hint/Help: mở hoặc ẩn hướng dẫn."
    ];
  }

  if (LINE_GAME_CODES.has(game.code)) {
    return [
      "4 mũi tên: di chuyển focus trên board.",
      "Enter: đặt quân vào ô đang focus.",
      "Back: quay về menu tổng của board.",
      "Máy đi ngẫu nhiên ở một ô hợp lệ."
    ];
  }

  if (game.code === "snake") {
    return [
      "Enter: bắt đầu hoặc tạm dừng rắn.",
      "4 mũi tên: đổi hướng trực tiếp cho rắn.",
      "Back: quay về menu tổng."
    ];
  }

  if (game.code === "match3") {
    return [
      "4 mũi tên: di chuyển focus trên board.",
      "Enter lần 1: chọn viên đầu tiên.",
      "Enter lần 2: chọn viên thứ hai để đổi chỗ nếu kề nhau.",
      "Back: quay về menu."
    ];
  }

  if (game.code === "memory") {
    return [
      "4 mũi tên: di chuyển focus qua các thẻ.",
      "Enter: lật thẻ đang focus.",
      "Khi lật đủ 2 thẻ, hệ thống tự kiểm tra cặp."
    ];
  }

  return [
    "4 mũi tên: di chuyển qua bảng màu và vùng vẽ.",
    "Enter trên bảng màu: chọn màu hoặc bật tẩy màu.",
    "Enter trên vùng vẽ: tô hoặc xóa ô đang focus.",
    "Back: quay về menu tổng."
  ];
}

function GameCatalogBoard({ games }) {
  const initialCatalogStateRef = useRef(readStoredCatalogState());
  const { token } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const initialGameCode = initialCatalogStateRef.current.selectedGameCode;
    const initialActiveGames = games.filter((game) => game.status !== "disabled");
    const initialIndex = initialActiveGames.findIndex((game) => game.code === initialGameCode);
    return initialIndex >= 0 ? initialIndex : 0;
  });
  const [mode, setMode] = useState(initialCatalogStateRef.current.mode);
  const [helpVisible, setHelpVisible] = useState(initialCatalogStateRef.current.helpVisible);
  const [sessions, setSessions] = useState({});
  const [reviews, setReviews] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const loadedSaveGamesRef = useRef(new Set());
  const loadingSaveGamesRef = useRef(new Set());
  const submittingResultGamesRef = useRef(new Set());
  const savingFinishedGamesRef = useRef(new Set());

  const activeGames = useMemo(() => games.filter((game) => game.status !== "disabled"), [games]);
  const selectedGame = activeGames[selectedIndex] || null;
  const selectedSession = selectedGame ? sessions[selectedGame.code] || null : null;

  useEffect(() => {
    if (!selectedGame) {
      return;
    }

    setSessions((current) =>
      current[selectedGame.code]
        ? current
        : {
            ...current,
            [selectedGame.code]: createGameSession(selectedGame)
          }
    );
  }, [selectedGame]);

  useEffect(() => {
    if (selectedIndex >= activeGames.length) {
      setSelectedIndex(0);
    }
  }, [activeGames.length, selectedIndex]);

  useEffect(() => {
    if (!selectedGame) {
      return;
    }

    localStorage.setItem(
      CATALOG_STORAGE_KEY,
      JSON.stringify({
        selectedGameCode: selectedGame.code,
        mode,
        helpVisible
      })
    );
  }, [helpVisible, mode, selectedGame]);

  useEffect(() => {
    if (!selectedGame && mode !== "menu") {
      setMode("menu");
    }
  }, [mode, selectedGame]);

  useEffect(() => {
    loadedSaveGamesRef.current.clear();
    loadingSaveGamesRef.current.clear();
    submittingResultGamesRef.current.clear();
    savingFinishedGamesRef.current.clear();
  }, [token]);

  useEffect(() => {
    if (!selectedGame) {
      setReviews([]);
      setSaveMessage("");
      setReviewMessage("");
      return;
    }

    setSaveMessage("");
    setReviewMessage("");

    api
      .getGameReviews(selectedGame.code)
      .then((payload) => setReviews(payload.data.reviews || []))
      .catch(() => setReviews([]));
  }, [selectedGame]);

  function updateSelectedSession(updater) {
    if (!selectedGame) {
      return;
    }

    setSessions((current) => {
      const base = current[selectedGame.code] || createGameSession(selectedGame);
      return {
        ...current,
        [selectedGame.code]: updater(base)
      };
    });
  }

  function moveSelection(step) {
    setSelectedIndex((current) => wrapIndex(current + step, activeGames.length));
  }

  async function handleManualSave() {
    if (!selectedGame) {
      return;
    }

    if (!token) {
      setSaveMessage("Cần đăng nhập để lưu tiến trình game.");
      return;
    }

    try {
      const session = selectedSession || createGameSession(selectedGame);
      await persistHubSave(selectedGame, session, { silent: false });
      setSaveMessage(`Đã lưu ${selectedGame.name} vào backend.`);
    } catch (error) {
      setSaveMessage(error.message || "Không thể lưu tiến trình game.");
    }
  }

  async function handleManualLoad() {
    if (!selectedGame) {
      return;
    }

    setSessions((current) => ({
      ...current,
      [selectedGame.code]: createGameSession(selectedGame)
    }));
    setMode("play");
    setSaveMessage(`Đã làm mới ván ${selectedGame.name}.`);
  }

  async function handleReviewSubmit(payload) {
    if (!selectedGame) {
      return;
    }

    if (!token) {
      setReviewMessage("Cần đăng nhập để gửi đánh giá.");
      return;
    }

    try {
      const response = await api.postGameReview(token, selectedGame.code, {
        ratingValue: payload.rating,
        commentBody: payload.comment
      });
      setReviews(response.data.reviews || []);
      setReviewMessage(`Đã gửi đánh giá cho ${selectedGame.name}.`);
    } catch (error) {
      setReviewMessage(error.message || "Không thể gửi đánh giá.");
    }
  }

  function persistHubSave(game, session, options = {}) {
    if (!token || !game || !session) {
      return Promise.resolve();
    }

    const { silent = true } = options;

    return api.postGameSave(token, game.code, buildHubSavePayload(game, session)).catch((error) => {
      if (!silent) {
        setSessions((current) => {
          const currentSession = current[game.code];
          if (!currentSession) {
            return current;
          }

          return {
            ...current,
            [game.code]: {
              ...currentSession,
              status: error.message || "Không thể lưu tiến trình game."
            }
          };
        });
      }

      throw error;
    });
  }

  function performLineMove() {
    updateSelectedSession((current) => {
      if (current.finished || current.board[current.focusIndex]) {
        return current;
      }

      const nextBoard = [...current.board];
      nextBoard[current.focusIndex] = "X";
      const playerWinLine = getWinningLine(
        nextBoard,
        selectedGame.rows,
        selectedGame.cols,
        selectedGame.winLength,
        "X"
      );

      if (playerWinLine.length) {
        return {
          ...current,
          board: nextBoard,
          winningLine: playerWinLine,
          finished: true,
          outcome: "win",
          score: selectedGame.code === "tictactoe" ? 100 : 140,
          status: "Bạn thắng. Máy chỉ đi ngẫu nhiên ở ô hợp lệ."
        };
      }

      if (nextBoard.every(Boolean)) {
        return {
          ...current,
          board: nextBoard,
          finished: true,
          outcome: "draw",
          score: 40,
          status: "Ván đấu hòa."
        };
      }

      const availableIndexes = nextBoard
        .map((value, index) => (value ? null : index))
        .filter((value) => value !== null);
      const pickedIndex =
        availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

      if (typeof pickedIndex === "number") {
        nextBoard[pickedIndex] = "O";
      }

      const computerWinLine = getWinningLine(
        nextBoard,
        selectedGame.rows,
        selectedGame.cols,
        selectedGame.winLength,
        "O"
      );

      if (computerWinLine.length) {
        return {
          ...current,
          board: nextBoard,
          winningLine: computerWinLine,
          finished: true,
          outcome: "lose",
          score: 10,
          status: "Máy thắng ở lượt vừa rồi."
        };
      }

      return {
        ...current,
        board: nextBoard,
        status: "Máy đã đánh xong. Tới lượt bạn."
      };
    });
  }

  function performMatch3Enter() {
    updateSelectedSession((current) => {
      if (current.finished) {
        return current;
      }

      if (current.activeIndex === null) {
        return {
          ...current,
          activeIndex: current.focusIndex,
          status: "Đã chọn viên đầu tiên."
        };
      }

      if (current.activeIndex === current.focusIndex) {
        return {
          ...current,
          activeIndex: null,
          status: "Đã bỏ chọn viên hiện tại."
        };
      }

      if (!areAdjacent(current.activeIndex, current.focusIndex, selectedGame.cols)) {
        return {
          ...current,
          activeIndex: current.focusIndex,
          movesCount: current.movesCount + 1,
          status: "Hai viên phải kề nhau theo hàng hoặc cột."
        };
      }

      const swappedBoard = swapCells(current.board, current.activeIndex, current.focusIndex);
      const matched = findMatch3Matches(swappedBoard, selectedGame.rows, selectedGame.cols);

      if (!matched.size) {
        return {
          ...current,
          activeIndex: null,
          status: "Đổi chỗ không tạo được hàng 3."
        };
      }

      const resolved = resolveMatch3Board(swappedBoard, selectedGame.rows, selectedGame.cols);
      const nextScore = current.score + resolved.scoreDelta;

      return {
        ...current,
        board: resolved.board,
        activeIndex: null,
        score: nextScore,
        movesCount: current.movesCount + 1,
        status: `Đã xóa ${resolved.totalCleared} ô, combo ${resolved.combos}.`
      };
    });
  }

  function performMemoryEnter() {
    updateSelectedSession((current) => {
      if (
        current.finished ||
        current.busy ||
        current.flippedIndexes.includes(current.focusIndex) ||
        current.matchedIndexes.includes(current.focusIndex)
      ) {
        return current;
      }

      const flippedIndexes = [...current.flippedIndexes, current.focusIndex];
      const busy = flippedIndexes.length === 2;

      return {
        ...current,
        flippedIndexes,
        busy,
        movesCount: busy ? current.movesCount + 1 : current.movesCount,
        status: busy ? "Đang kiểm tra cặp thẻ..." : "Đã lật thẻ đầu tiên."
      };
    });
  }

  function performFreeDrawEnter() {
    updateSelectedSession((current) => {
      const paletteCount = DRAW_PALETTE.length + 1;

      if (current.focusIndex < paletteCount) {
        if (current.focusIndex === HUB_FREE_DRAW_ERASER_INDEX) {
        return {
          ...current,
          activeTool: "erase",
          status: "Đã chọn tẩy màu."
          };
        }

        return {
          ...current,
          activeColorIndex: current.focusIndex,
          activeTool: "paint",
          status: "Đã chọn màu mới."
        };
      }

      if (current.finished) {
        return current;
      }

      const boardIndex = current.focusIndex - paletteCount;
      const nextBoard = [...current.board];
      nextBoard[boardIndex] =
        current.activeTool === "erase" ? null : DRAW_PALETTE[current.activeColorIndex];
      const score = calculateFreeDrawScore(nextBoard);

      return {
        ...current,
        board: nextBoard,
        score,
        movesCount: current.movesCount + 1,
        status:
          current.activeTool === "erase"
            ? "Đã xóa màu ở ô đang chọn."
            : "Đã tô màu một ô."
      };
    });
  }

  function handleGameAction(action) {
    if (!selectedGame) {
      return;
    }

    if (mode === "menu") {
      if (action === "left") {
        moveSelection(-1);
      }

      if (action === "right") {
        moveSelection(1);
      }

      if (action === "enter") {
        setMode("play");
      }

      if (action === "help") {
        setHelpVisible((current) => !current);
      }

      return;
    }

    if (action === "back") {
      persistHubSave(selectedGame, selectedSession);
      setMode("menu");
      return;
    }

    if (action === "help") {
      setHelpVisible((current) => !current);
      return;
    }

    if (LINE_GAME_CODES.has(selectedGame.code)) {
      if (["left", "right", "up", "down"].includes(action)) {
        updateSelectedSession((current) => ({
          ...current,
          focusIndex: moveGridIndex(
            current.focusIndex,
            selectedGame.rows,
            selectedGame.cols,
            action
          ),
          status: current.finished ? current.status : "Đã di chuyển focus trên board."
        }));
      }

      if (action === "enter") {
        performLineMove();
      }

      return;
    }

    if (selectedGame.code === "snake") {
      if (["left", "right", "up", "down"].includes(action)) {
        updateSelectedSession((current) => {
          if (current.queuedDirection && current.queuedDirection !== current.direction) {
            return current;
          }

          const nextDirection = action;
          const currentVector = DIRECTION_VECTORS[current.direction];
          const nextVector = DIRECTION_VECTORS[nextDirection];
          const isReverse =
            currentVector.row + nextVector.row === 0 &&
            currentVector.col + nextVector.col === 0;

          if (isReverse) {
            return current;
          }

          return {
            ...current,
            queuedDirection: nextDirection,
            status: current.running ? "Rắn đã đổi hướng." : "Đã sẵn sàng hướng mới."
          };
        });
      }

      if (action === "enter") {
        updateSelectedSession((current) => ({
          ...current,
          running: current.finished ? false : !current.running,
          status: current.finished
            ? current.status
            : current.running
              ? "Đã tạm dừng rắn."
              : "Rắn đang chạy."
        }));
      }

      return;
    }

    if (selectedGame.code === "match3") {
      if (["left", "right", "up", "down"].includes(action)) {
        updateSelectedSession((current) => ({
          ...current,
          focusIndex: moveGridIndexBounded(
            current.focusIndex,
            selectedGame.rows,
            selectedGame.cols,
            action
          ),
          status: current.status
        }));
      }

      if (action === "enter") {
        performMatch3Enter();
      }

      return;
    }

    if (selectedGame.code === "memory") {
      if (["left", "right", "up", "down"].includes(action)) {
        updateSelectedSession((current) => ({
          ...current,
          focusIndex: moveGridIndex(
            current.focusIndex,
            selectedGame.rows,
            selectedGame.cols,
            action
          )
        }));
      }

      if (action === "enter") {
        performMemoryEnter();
      }

      return;
    }

    if (["left", "right", "up", "down"].includes(action)) {
      updateSelectedSession((current) => ({
        ...current,
        focusIndex: moveFreeDrawIndex(current.focusIndex, action, selectedGame)
      }));
    }

    if (action === "enter") {
      performFreeDrawEnter();
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (!selectedGame) {
        return;
      }

      if (shouldIgnoreGameHotkeys(event)) {
        return;
      }

      const normalizedKey = event.key.toLowerCase();

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleGameAction("left");
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleGameAction("right");
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        handleGameAction("up");
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        handleGameAction("down");
      }

      if (event.key === "Enter") {
        event.preventDefault();
        handleGameAction("enter");
      }

      if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        handleGameAction("back");
      }

      if (event.key === "F1" || normalizedKey === "h") {
        event.preventDefault();
        handleGameAction("help");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, selectedGame]);

  useEffect(() => {
    if (mode !== "play" || !selectedGame || !selectedSession || selectedSession.finished) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      updateSelectedSession((current) => {
        if (current.finished) {
          return current;
        }

        if (current.timeLeft <= 1) {
          return {
            ...current,
            timeLeft: 0,
            finished: true,
            running: false,
            outcome: current.outcome || "timeout",
            status: "Hết giờ. Trò chơi kết thúc."
          };
        }

        return {
          ...current,
          timeLeft: current.timeLeft - 1
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, selectedGame, selectedSession?.finished]);

  useEffect(() => {
    if (
      mode !== "play" ||
      selectedGame?.code !== "snake" ||
      !selectedSession ||
      !selectedSession.running ||
      selectedSession.finished
    ) {
      return undefined;
    }

    const movement = window.setInterval(() => {
      updateSelectedSession((current) => {
        if (current.finished || !current.running) {
          return current;
        }

        const appliedDirection = current.queuedDirection || current.direction;
        const vector = DIRECTION_VECTORS[appliedDirection];
        const nextHead = {
          row: current.snake[0].row + vector.row,
          col: current.snake[0].col + vector.col
        };
        const hitsWall =
          nextHead.row < 0 ||
          nextHead.row >= selectedGame.rows ||
          nextHead.col < 0 ||
          nextHead.col >= selectedGame.cols;
        const ateFood = current.food && samePoint(nextHead, current.food);
        const snakeToCheck = ateFood ? current.snake : current.snake.slice(0, -1);
        const hitsSelf = snakeToCheck.some((segment) => samePoint(segment, nextHead));

        if (hitsWall || hitsSelf) {
          return {
            ...current,
            direction: appliedDirection,
            queuedDirection: null,
            running: false,
            finished: true,
            outcome: "lose",
            movesCount: current.movesCount + 1,
            status: "Rắn đã va chạm. Phiên chơi kết thúc."
          };
        }

        const nextSnake = ateFood
          ? [nextHead, ...current.snake]
          : [nextHead, ...current.snake.slice(0, -1)];
        const nextScore = ateFood ? current.score + 20 : current.score;

        if (nextSnake.length === selectedGame.rows * selectedGame.cols) {
          return {
            ...current,
            snake: nextSnake,
            direction: appliedDirection,
            queuedDirection: null,
            running: false,
            finished: true,
            outcome: "win",
            score: nextScore,
            movesCount: current.movesCount + 1,
            status: "Bạn đã phủ kín toàn bộ board."
          };
        }

        return {
          ...current,
          snake: nextSnake,
          food: ateFood ? randomFood(selectedGame.rows, selectedGame.cols, nextSnake) : current.food,
          direction: appliedDirection,
          queuedDirection: null,
          score: nextScore,
          movesCount: current.movesCount + 1,
          status: ateFood ? "Đã ăn mồi. Tiếp tục di chuyển." : current.status
        };
      });
    }, 240);

    return () => window.clearInterval(movement);
  }, [
    mode,
    selectedGame?.code,
    selectedGame?.rows,
    selectedGame?.cols,
    selectedSession?.running,
    selectedSession?.finished
  ]);

  useEffect(() => {
    if (
      selectedGame?.code !== "memory" ||
      !selectedSession ||
      !selectedSession.busy ||
      selectedSession.flippedIndexes.length !== 2
    ) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      updateSelectedSession((current) => {
        const [firstIndex, secondIndex] = current.flippedIndexes;
        const isMatch = current.cards[firstIndex] === current.cards[secondIndex];

        if (isMatch) {
          const matchedIndexes = [...current.matchedIndexes, firstIndex, secondIndex];
          const didWin = matchedIndexes.length === current.cards.length;

          return {
            ...current,
            matchedIndexes,
            flippedIndexes: [],
            busy: false,
            score: current.score + 25,
            finished: didWin,
            outcome: didWin ? "win" : current.outcome,
            status: didWin ? "Bạn đã lật hết tất cả các cặp." : "Đã tìm thấy một cặp mới."
          };
        }

        return {
          ...current,
          flippedIndexes: [],
          busy: false,
          status: "Không trùng cặp, hãy thử lại."
        };
      });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [selectedGame, selectedSession]);

  useEffect(() => {
    if (!token || !selectedGame) {
      return;
    }

    const gameCode = selectedGame.code;
    if (
      loadedSaveGamesRef.current.has(gameCode) ||
      loadingSaveGamesRef.current.has(gameCode)
    ) {
      return;
    }

    loadingSaveGamesRef.current.add(gameCode);
    let cancelled = false;

    api
      .getGameSave(token, gameCode)
      .then((payload) => {
        if (cancelled || !payload.data || !isPlayableSave(payload.data)) {
          return;
        }

        setSessions((current) => {
          return {
            ...current,
            [gameCode]: hydrateHubSessionFromSave(selectedGame, payload.data)
          };
        });
      })
      .catch(() => {})
      .finally(() => {
        loadingSaveGamesRef.current.delete(gameCode);
        loadedSaveGamesRef.current.add(gameCode);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGame, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    activeGames.forEach((game) => {
      const session = sessions[game.code];

      if (!session?.finished) {
        savingFinishedGamesRef.current.delete(game.code);
        return;
      }

      if (
        session.resultSubmitted ||
        submittingResultGamesRef.current.has(game.code)
      ) {
        return;
      }

      submittingResultGamesRef.current.add(game.code);

      api
        .submitGameResult(token, game.code, buildHubResultPayload(game, session))
        .then(() => {
          setSessions((current) => {
            const currentSession = current[game.code];
            if (!currentSession) {
              return current;
            }

            return {
              ...current,
              [game.code]: {
                ...currentSession,
                resultSubmitted: true
              }
            };
          });
        })
        .catch((error) => {
          setSessions((current) => {
            const currentSession = current[game.code];
            if (!currentSession) {
              return current;
            }

            return {
              ...current,
              [game.code]: {
                ...currentSession,
                status: error.message || "Không thể đồng bộ kết quả game."
              }
            };
          });
        })
        .finally(() => {
          submittingResultGamesRef.current.delete(game.code);
        });
    });
  }, [activeGames, sessions, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    activeGames.forEach((game) => {
      const session = sessions[game.code];

      if (!session?.finished) {
        savingFinishedGamesRef.current.delete(game.code);
        return;
      }

      savingFinishedGamesRef.current.delete(game.code);
    });
  }, [activeGames, sessions, token]);

  const boardCells = useMemo(() => {
    if (!selectedGame) {
      return createBaseCells();
    }

    if (mode === "menu") {
      return buildMenuCells(activeGames, selectedIndex);
    }

    return buildPlayCells(selectedGame, selectedSession || createGameSession(selectedGame));
  }, [activeGames, mode, selectedGame, selectedIndex, selectedSession]);

  const summary = selectedGame
    ? getSessionSummary(selectedGame, selectedSession, mode)
    : { score: 0, timeLabel: "--:--", status: "" };
  const helpItems = selectedGame ? getHelpItems(selectedGame, mode) : [];

  if (!selectedGame) {
    return (
      <section className="panel">
        <p className="eyebrow">Bộ board game</p>
        <h1>Chưa có game khả dụng</h1>
      </section>
    );
  }

  return (
    <div className="catalog-shell">
      <section className="panel catalog-panel">
        <div className="catalog-header">
          <div>
            <p className="eyebrow">Bộ board game</p>
            <h1>{mode === "menu" ? "Board dot-matrix 20 x 20" : selectedGame.name}</h1>
          </div>

          <div className="catalog-stats">
            <div>
              <span className="stat-label">Điểm</span>
              <strong>{summary.score}</strong>
            </div>
            <div>
              <span className="stat-label">Thời gian</span>
              <strong>{summary.timeLabel}</strong>
            </div>
          </div>
        </div>

        <section className="status-banner catalog-status">
          <strong>{mode === "menu" ? "Menu:" : "Trạng thái:"}</strong> {summary.status}
        </section>

        <div className="catalog-board-stage">
          <BoardGrid
            className="catalog-matrix-board"
            rows={BOARD_SIZE}
            cols={BOARD_SIZE}
            cells={boardCells}
            highlightSelection={false}
            matrixScale={1}
            matrixGap={0}
            matrixPadding={0}
            matrixDotSize="0.96rem"
            onCellClick={(cellIndex) => {
              const actionIndex = boardCells[cellIndex]?.actionIndex;
              if (typeof actionIndex !== "number") {
                return;
              }

              if (mode === "menu") {
                return;
              }

              if (LINE_GAME_CODES.has(selectedGame.code)) {
                updateSelectedSession((current) => ({ ...current, focusIndex: actionIndex }));
                return;
              }

              if (selectedGame.code === "match3") {
                updateSelectedSession((current) => ({ ...current, focusIndex: actionIndex }));
                return;
              }

              if (selectedGame.code === "memory") {
                updateSelectedSession((current) => ({ ...current, focusIndex: actionIndex }));
                return;
              }

              if (selectedGame.code === "free-draw") {
                updateSelectedSession((current) => ({ ...current, focusIndex: actionIndex }));
              }
            }}
          />
        </div>

        {mode === "menu" ? (
          <div className="catalog-controls catalog-controls--menu">
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--left"
              onClick={() => handleGameAction("left")}
            >
              Left
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--right"
              onClick={() => handleGameAction("right")}
            >
              Right
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--back"
              onClick={() => handleGameAction("back")}
            >
              Back
            </button>
            <button
              type="button"
              className="primary-button catalog-control catalog-control--enter"
              onClick={() => handleGameAction("enter")}
            >
              Enter
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--help"
              onClick={() => handleGameAction("help")}
            >
              {helpVisible ? "Ẩn Help" : "Hint/Help"}
            </button>
          </div>
        ) : (
          <div className="catalog-controls catalog-controls--play">
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--up"
              onClick={() => handleGameAction("up")}
            >
              Up
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--left"
              onClick={() => handleGameAction("left")}
            >
              Left
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--down"
              onClick={() => handleGameAction("down")}
            >
              Down
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--right"
              onClick={() => handleGameAction("right")}
            >
              Right
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--back"
              onClick={() => handleGameAction("back")}
            >
              Back
            </button>
            <button
              type="button"
              className="primary-button catalog-control catalog-control--enter"
              onClick={() => handleGameAction("enter")}
            >
              Enter
            </button>
            <button
              type="button"
              className="secondary-button catalog-control catalog-control--help"
              onClick={() => handleGameAction("help")}
            >
              {helpVisible ? "Ẩn Help" : "Hint/Help"}
            </button>
          </div>
        )}

        {mode === "menu" ? (
          <p className="catalog-caption">SELECT GAME (LEFT/RIGHT -&gt; ENTER)</p>
        ) : null}
      </section>

      <aside className="panel catalog-sidebar">
        <section className="catalog-sidebar-card">
          <p className="eyebrow">Game đang chọn</p>
          <h2>{selectedGame.name}</h2>
        </section>

        <section className="catalog-sidebar-card sidebar-action-card">
          <p className="eyebrow">Tác vụ game</p>
          <div className="sidebar-action-grid">
            <button
              type="button"
              className="secondary-button"
              onClick={handleManualSave}
              disabled={!selectedGame.supportsSaveLoad}
            >
              Save game
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleManualLoad}
            >
              Reset game
            </button>
          </div>
          {saveMessage ? <p className="muted">{saveMessage}</p> : null}
        </section>

        {helpVisible ? (
          <section className="catalog-sidebar-card">
            <p className="eyebrow">Hướng dẫn</p>
            <ul className="list">
              {helpItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {selectedGame.supportsRating || selectedGame.supportsComment ? (
          <section className="catalog-sidebar-card">
            {reviewMessage ? <p className="muted">{reviewMessage}</p> : null}
            <ReviewsPanel
              key={selectedGame.code}
              reviews={reviews}
              onAddReview={handleReviewSubmit}
            />
          </section>
        ) : null}
      </aside>
    </div>
  );
}

export default GameCatalogBoard;
