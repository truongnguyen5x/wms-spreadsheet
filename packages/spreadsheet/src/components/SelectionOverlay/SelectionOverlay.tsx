import { memo } from "react";
import type { INormalizedRange } from "../../types";
import { computeRangeBounds } from "../../utils/gridDimensions";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import {
  computeVisiblePhysicalRangeBounds,
  type IVisibleRowLayout,
} from "../../utils/visibleRowLayout";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISelectionOverlayProps {
  range: INormalizedRange;
  dimensions: IGridDimensions;
  visibleRowLayout?: IVisibleRowLayout;
  columnLeftOffset?: number;
  showFillHandle?: boolean;
  hideLeftBorder?: boolean;
  hideRightBorder?: boolean;
  showHandle?: boolean;
}

export const SelectionOverlay = memo(function SelectionOverlay({
  range,
  dimensions,
  visibleRowLayout,
  columnLeftOffset = 0,
  showFillHandle = false,
  hideLeftBorder = false,
  hideRightBorder = false,
  showHandle = true,
}: ISelectionOverlayProps) {
  const rowBounds = visibleRowLayout
    ? computeVisiblePhysicalRangeBounds(
        visibleRowLayout,
        range.startRow,
        range.endRow,
      )
    : computeRangeBounds(
        dimensions.rowHeights,
        range.startRow,
        range.endRow,
      );
  if (rowBounds === null) return null;
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

