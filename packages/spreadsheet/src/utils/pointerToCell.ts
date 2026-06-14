import type { ICellAddress } from "../types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pointerToCell(
  clientX: number,
  clientY: number,
  scrollEl: HTMLElement,
  rowHeight: number,
  columnWidth: number,
  rowCount: number,
  columnCount: number,
): ICellAddress {
  const rect = scrollEl.getBoundingClientRect();
  const totalWidth = columnCount * columnWidth;
  const totalHeight = rowCount * rowHeight;

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
    row: clamp(Math.floor(contentY / rowHeight), 0, rowCount - 1),
    col: clamp(Math.floor(contentX / columnWidth), 0, columnCount - 1),
  };
}
