import { memo } from "react";
import type { INormalizedRange } from "../../types";
import { computeRangeBounds } from "../../utils/gridDimensions";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISelectionOverlayProps {
  range: INormalizedRange;
  dimensions: IGridDimensions;
  columnLeftOffset?: number;
  showFillHandle?: boolean;
  hideLeftBorder?: boolean;
  hideRightBorder?: boolean;
  showHandle?: boolean;
}

export const SelectionOverlay = memo(function SelectionOverlay({
  range,
  dimensions,
  columnLeftOffset = 0,
  showFillHandle = false,
  hideLeftBorder = false,
  hideRightBorder = false,
  showHandle = true,
}: ISelectionOverlayProps) {
  const rowBounds = computeRangeBounds(
    dimensions.rowHeights,
    range.startRow,
    range.endRow,
  );
  const colBounds = computeRangeBounds(
    dimensions.columnWidths,
    range.startCol,
    range.endCol,
  );
  const className = [
    styles.selectionOverlay,
    showFillHandle ? styles.selectionOverlaySingle : "",
    hideLeftBorder ? styles.hideLeftBorder : "",
    hideRightBorder ? styles.hideRightBorder : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={className}
      style={{
        top: rowBounds.offset,
        left: colBounds.offset - columnLeftOffset,
        width: colBounds.size,
        height: rowBounds.size,
      }}
      aria-hidden
    >
      {showHandle &&
        (showFillHandle ? (
          <span className={styles.fillHandle} />
        ) : (
          <span className={styles.selectionHandle} />
        ))}
    </div>
  );
});

