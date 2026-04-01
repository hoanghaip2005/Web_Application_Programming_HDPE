function resolveMatrixScale(rows, cols, preferredScale) {
  if (preferredScale) {
    return preferredScale;
  }

  const maxDimension = Math.max(rows, cols);
  if (maxDimension <= 4) {
    return 4;
  }

  if (maxDimension <= 8) {
    return 2;
  }

  return 1;
}

function getMatrixPattern(cell, scale) {
  if (cell.matrixMask) {
    return cell.matrixMask;
  }

  if (cell.pattern) {
    return cell.pattern;
  }

  if (cell.value === "X") {
    return "cross";
  }

  if (cell.value === "O") {
    return "ring";
  }

  if (cell.value || cell.style?.background) {
    return scale > 1 ? "solid" : "dot";
  }

  return "none";
}

function shouldFillPattern(pattern, localRow, localCol, scale) {
  if (Array.isArray(pattern)) {
    return Boolean(pattern[localRow]?.[localCol]);
  }

  if (pattern === "solid") {
    return true;
  }

  if (pattern === "dot") {
    return localRow === Math.floor(scale / 2) && localCol === Math.floor(scale / 2);
  }

  if (pattern === "cross") {
    return localRow === localCol || localRow + localCol === scale - 1;
  }

  if (pattern === "ring") {
    return (
      localRow === 0 ||
      localRow === scale - 1 ||
      localCol === 0 ||
      localCol === scale - 1
    );
  }

  return false;
}

function BoardGrid({
  rows,
  cols,
  cells,
  className = "",
  selectedIndex = -1,
  highlightSelection = true,
  onCellClick,
  disabled = false,
  size = "medium",
  variant = "matrix",
  matrixScale,
  matrixDotSize,
  matrixGap,
  matrixPadding = 1
}) {
  if (variant === "standard") {
    return (
      <div
        className={`board-grid board-grid--${size} ${className}`.trim()}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, index) => {
          const cell = cells[index] || {};
          return (
            <button
              key={index}
              type="button"
              className={`board-cell ${
                highlightSelection && selectedIndex === index ? "is-selected" : ""
              } ${
                cell.className || ""
              }`}
              style={cell.style}
              onClick={() => onCellClick?.(index)}
              disabled={disabled || cell.disabled}
              title={cell.label}
            >
              <span>{cell.value ?? ""}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const scale = resolveMatrixScale(rows, cols, matrixScale);
  const gap = matrixGap ?? (scale > 1 ? 1 : 0);
  const outerPadding = scale > 1 ? matrixPadding : 0;
  const matrixRows = rows * scale + Math.max(0, rows - 1) * gap + outerPadding * 2;
  const matrixCols = cols * scale + Math.max(0, cols - 1) * gap + outerPadding * 2;
  const maxDimension = Math.max(rows, cols);
  const dotSize =
    matrixDotSize ||
    (maxDimension <= 4
      ? "1.6rem"
      : maxDimension <= 8
        ? "1.3rem"
        : "1.08rem");

  return (
    <div className="board-grid-shell">
      <div
        className={`board-grid board-grid--${size} board-grid--matrix ${className}`.trim()}
        style={{
          gridTemplateColumns: `repeat(${matrixCols}, var(--matrix-dot-size))`,
          "--matrix-dot-size": dotSize
        }}
      >
        {Array.from({ length: matrixRows * matrixCols }).map((_, index) => {
          const matrixRow = Math.floor(index / matrixCols);
          const matrixCol = index % matrixCols;
          const relativeRow = matrixRow - outerPadding;
          const relativeCol = matrixCol - outerPadding;
          const rowBand = scale + gap;
          const colBand = scale + gap;
          const isInsideRow = relativeRow >= 0 && relativeRow < rows * rowBand - gap;
          const isInsideCol = relativeCol >= 0 && relativeCol < cols * colBand - gap;
          const logicalRow = isInsideRow ? Math.floor(relativeRow / rowBand) : -1;
          const logicalCol = isInsideCol ? Math.floor(relativeCol / colBand) : -1;
          const localRow = isInsideRow ? relativeRow % rowBand : -1;
          const localCol = isInsideCol ? relativeCol % colBand : -1;
          const isGapDot =
            !isInsideRow || !isInsideCol || localRow >= scale || localCol >= scale;
          const logicalIndex =
            logicalRow >= 0 && logicalCol >= 0 ? logicalRow * cols + logicalCol : -1;
          const cell = logicalIndex >= 0 ? cells[logicalIndex] || {} : {};
          const pattern = getMatrixPattern(cell, scale);
          const isFilled = !isGapDot && shouldFillPattern(pattern, localRow, localCol, scale);
          const isSelected =
            highlightSelection && logicalIndex >= 0 && logicalIndex === selectedIndex;
          const showValue =
            isFilled &&
            scale >= 3 &&
            localRow === Math.floor(scale / 2) &&
            localCol === Math.floor(scale / 2);

          const style = isFilled
            ? {
                background:
                  cell.style?.background ||
                  "rgba(255,255,255,0.24)",
                color: cell.style?.color || "white"
              }
            : undefined;

          const className = [
            "matrix-dot",
            isGapDot ? "is-gap" : "",
            isFilled ? "is-filled" : "",
            isSelected ? "is-selected" : "",
            cell.className || ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={index}
              type="button"
              className={className}
              style={style}
              onClick={() => {
                if (logicalIndex >= 0) {
                  onCellClick?.(logicalIndex);
                }
              }}
              disabled={disabled || isGapDot || cell.disabled}
              title={cell.label}
            >
              <span>{showValue ? cell.value ?? "" : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BoardGrid;
