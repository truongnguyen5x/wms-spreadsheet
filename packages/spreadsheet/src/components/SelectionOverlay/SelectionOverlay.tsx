import { memo } from "react";
import type { INormalizedRange, ISelection } from "../../types";
import { isSingleCellSelection, normalizeSelection } from "../../utils/normalizeRange";
import { computeRangeBounds } from "../../utils/gridDimensions";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISelectionOverlayProps {
  selection: ISelection;
  dimensions: IGridDimensions;
}

export const SelectionOverlay = memo(function SelectionOverlay({
  selection,
  dimensions,
}: ISelectionOverlayProps) {
  const range: INormalizedRange = normalizeSelection(selection);
  const isSingle = isSingleCellSelection(selection);

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
      className={`${styles.selectionOverlay}${isSingle ? ` ${styles.selectionOverlaySingle}` : ""}`}
      style={{
        top: rowBounds.offset,
        left: colBounds.offset,
        width: colBounds.size,
        height: rowBounds.size,
      }}
      aria-hidden
    >
      {isSingle ? (
        <span className={styles.fillHandle} />
      ) : (
        <span className={styles.selectionHandle} />
      )}
    </div>
  );
});
