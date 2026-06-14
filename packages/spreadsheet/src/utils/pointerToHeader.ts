import { findIndexAtOffset, getTotalSize } from "./gridDimensions";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pointerToColumn(
  clientX: number,
  headerPaneEl: HTMLElement,
  scrollLeft: number,
  columnWidths: readonly number[],
  columnCount: number,
): number {
  const rect = headerPaneEl.getBoundingClientRect();
  const totalWidth = getTotalSize(columnWidths);

  const contentX = clamp(
    scrollLeft + (clientX - rect.left),
    0,
    Math.max(0, totalWidth - 1),
  );

  return clamp(
    findIndexAtOffset(columnWidths, contentX),
    0,
    columnCount - 1,
  );
}

export function pointerToRow(
  clientY: number,
  headerPaneEl: HTMLElement,
  scrollTop: number,
  rowHeights: readonly number[],
  rowCount: number,
): number {
  const rect = headerPaneEl.getBoundingClientRect();
  const totalHeight = getTotalSize(rowHeights);

  const contentY = clamp(
    scrollTop + (clientY - rect.top),
    0,
    Math.max(0, totalHeight - 1),
  );

  return clamp(findIndexAtOffset(rowHeights, contentY), 0, rowCount - 1);
}
