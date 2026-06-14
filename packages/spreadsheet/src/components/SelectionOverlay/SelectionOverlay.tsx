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
}

export const SelectionOverlay = memo(function SelectionOverlay({
  range,
  dimensions,
  columnLeftOffset = 0,
  showFillHandle = false,
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

  return (
    <div
      className={`${styles.selectionOverlay}${showFillHandle ? ` ${styles.selectionOverlaySingle}` : ""}`}
      style={{
        top: rowBounds.offset,
        left: colBounds.offset - columnLeftOffset,
        width: colBounds.size,
        height: rowBounds.size,
      }}
      aria-hidden
    >
      {showFillHandle ? (
        <span className={styles.fillHandle} />
      ) : (
        <span className={styles.selectionHandle} />
      )}
    </div>
  );
});
