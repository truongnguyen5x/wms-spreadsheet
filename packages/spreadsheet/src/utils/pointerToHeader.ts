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
  frozenWidth = 0,
  frozenHeaderEl?: HTMLElement | null,
): number {
  const scrollableTotalWidth = Math.max(0, getTotalSize(columnWidths) - frozenWidth);

  let contentX: number;

  if (frozenHeaderEl && frozenWidth > 0) {
    const frozenRect = frozenHeaderEl.getBoundingClientRect();
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
      const rect = headerPaneEl.getBoundingClientRect();
      contentX = clamp(
        frozenWidth + scrollLeft + (clientX - rect.left),
        frozenWidth,
        Math.max(frozenWidth, frozenWidth + scrollableTotalWidth - 1),
      );
    }
  } else {
    const rect = headerPaneEl.getBoundingClientRect();
    const totalWidth = getTotalSize(columnWidths);
    contentX = clamp(
      scrollLeft + (clientX - rect.left),
      0,
      Math.max(0, totalWidth - 1),
    );
  }

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
