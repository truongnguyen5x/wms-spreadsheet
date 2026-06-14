import type { ICellAddress } from "../types";
import { findIndexAtOffset, getTotalSize } from "./gridDimensions";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pointerToCell(
  clientX: number,
  clientY: number,
  scrollEl: HTMLElement,
  rowHeights: readonly number[],
  columnWidths: readonly number[],
  rowCount: number,
  columnCount: number,
): ICellAddress {
  const rect = scrollEl.getBoundingClientRect();
  const totalWidth = getTotalSize(columnWidths);
  const totalHeight = getTotalSize(rowHeights);

  const contentX = clamp(
    scrollEl.scrollLeft + (clientX - rect.left),
    0,
    Math.max(0, totalWidth - 1),
  );
  const contentY = clamp(
    scrollEl.scrollTop + (clientY - rect.top),
    0,
    Math.max(0, totalHeight - 1),
  );

  return {
    row: clamp(findIndexAtOffset(rowHeights, contentY), 0, rowCount - 1),
    col: clamp(findIndexAtOffset(columnWidths, contentX), 0, columnCount - 1),
  };
}
