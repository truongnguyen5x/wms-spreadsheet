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
  frozenWidth = 0,
  frozenBodyEl?: HTMLElement | null,
): ICellAddress {
  const totalHeight = getTotalSize(rowHeights);
  const scrollableTotalWidth = Math.max(
    0,
    getTotalSize(columnWidths) - frozenWidth,
  );
  const scrollLeft = scrollEl.scrollLeft;
  let contentX: number;
  if (frozenBodyEl && frozenWidth > 0) {
    const frozenRect = frozenBodyEl.getBoundingClientRect();
    const inFrozenZone =
      clientX >= frozenRect.left && clientX < frozenRect.right;
    if (inFrozenZone && scrollLeft > 0) {
      contentX = frozenWidth + scrollLeft;
    } else if (inFrozenZone) {
      contentX = clamp(
        clientX - frozenRect.left,
        0,
        Math.max(0, frozenWidth - 1),
      );
    } else {
      const rect = scrollEl.getBoundingClientRect();
      contentX = clamp(
        frozenWidth + scrollLeft + (clientX - rect.left),
        frozenWidth,
        Math.max(frozenWidth, frozenWidth + scrollableTotalWidth - 1),
      );
    }
  } else {
    const rect = scrollEl.getBoundingClientRect();
    const totalWidth = getTotalSize(columnWidths);
    contentX = clamp(
      scrollLeft + (clientX - rect.left),
      0,
      Math.max(0, totalWidth - 1),
    );
  }

  const rect = scrollEl.getBoundingClientRect();
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

