import { memo } from "react";
import type { INormalizedRange } from "../../types";
import { isSingleCellSelection, normalizeSelection } from "../../utils/normalizeRange";
import type { ISelection } from "../../types";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISelectionOverlayProps {
  selection: ISelection;
  rowHeight: number;
  columnWidth: number;
}

export const SelectionOverlay = memo(function SelectionOverlay({
  selection,
  rowHeight,
  columnWidth,
}: ISelectionOverlayProps) {
  const range: INormalizedRange = normalizeSelection(selection);
  const isSingle = isSingleCellSelection(selection);

  const top = range.startRow * rowHeight;
  const left = range.startCol * columnWidth;
  const width = (range.endCol - range.startCol + 1) * columnWidth;
  const height = (range.endRow - range.startRow + 1) * rowHeight;

  return (
    <div
      className={`${styles.selectionOverlay}${isSingle ? ` ${styles.selectionOverlaySingle}` : ""}`}
      style={{ top, left, width, height }}
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
