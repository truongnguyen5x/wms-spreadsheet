import { memo } from "react";
import type { INormalizedRange } from "../../types";
import { computeRangeBounds } from "../../utils/gridDimensions";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import styles from "../../styles/spreadsheet.module.scss";

export interface IClipboardOverlayProps {
  range: INormalizedRange;
  dimensions: IGridDimensions;
  columnLeftOffset?: number;
  hideLeftBorder?: boolean;
  hideRightBorder?: boolean;
}

export const ClipboardOverlay = memo(function ClipboardOverlay({
  range,
  dimensions,
  columnLeftOffset = 0,
  hideLeftBorder = false,
  hideRightBorder = false,
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
  const className = [
    styles.clipboardOverlay,
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
    />
  );
});

