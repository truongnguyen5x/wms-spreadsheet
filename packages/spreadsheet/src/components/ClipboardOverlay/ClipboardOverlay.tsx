import { memo } from "react";
import type { INormalizedRange } from "../../types";
import { computeRangeBounds } from "../../utils/gridDimensions";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import styles from "../../styles/spreadsheet.module.scss";

export interface IClipboardOverlayProps {
  range: INormalizedRange;
  dimensions: IGridDimensions;
}

export const ClipboardOverlay = memo(function ClipboardOverlay({
  range,
  dimensions,
}: IClipboardOverlayProps) {
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
      className={styles.clipboardOverlay}
      style={{
        top: rowBounds.offset,
        left: colBounds.offset,
        width: colBounds.size,
        height: rowBounds.size,
      }}
      aria-hidden
    />
  );
});
