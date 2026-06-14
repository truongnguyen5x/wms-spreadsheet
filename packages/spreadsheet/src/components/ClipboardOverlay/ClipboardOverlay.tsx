import { memo } from "react";
import type { INormalizedRange } from "../../types";
import styles from "../../styles/spreadsheet.module.scss";

export interface IClipboardOverlayProps {
  range: INormalizedRange;
  rowHeight: number;
  columnWidth: number;
}

export const ClipboardOverlay = memo(function ClipboardOverlay({
  range,
  rowHeight,
  columnWidth,
}: IClipboardOverlayProps) {
  const top = range.startRow * rowHeight;
  const left = range.startCol * columnWidth;
  const width = (range.endCol - range.startCol + 1) * columnWidth;
  const height = (range.endRow - range.startRow + 1) * rowHeight;

  return (
    <div
      className={styles.clipboardOverlay}
      style={{ top, left, width, height }}
      aria-hidden
    />
  );
});
