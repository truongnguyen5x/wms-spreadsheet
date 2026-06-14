import { findIndexAtOffset } from "./gridDimensions";

export interface IVisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export function computeVisibleRange(
  scrollTop: number,
  scrollLeft: number,
  viewportHeight: number,
  viewportWidth: number,
  rowHeights: readonly number[],
  columnWidths: readonly number[],
  rowCount: number,
  columnCount: number,
  overscan = 3,
  frozenColumnCount = 0,
): IVisibleRange {
  const startRow = Math.max(
    0,
    findIndexAtOffset(rowHeights, scrollTop) - overscan,
  );
  const endRow = Math.min(
    rowCount - 1,
    findIndexAtOffset(rowHeights, scrollTop + viewportHeight) + overscan,
  );
  const scrollableColumnCount = columnCount - frozenColumnCount;
  if (scrollableColumnCount <= 0) {
    return {
      startRow,
      endRow,
      startCol: 0,
      endCol: Math.max(0, columnCount - 1),
    };
  }

  const scrollableWidths = columnWidths.slice(frozenColumnCount);
  const scrollableStartCol = Math.max(
    0,
    findIndexAtOffset(scrollableWidths, scrollLeft) - overscan,
  );
  const scrollableEndCol = Math.min(
    scrollableColumnCount - 1,
    findIndexAtOffset(scrollableWidths, scrollLeft + viewportWidth) + overscan,
  );
  return {
    startRow,
    endRow,
    startCol: frozenColumnCount + scrollableStartCol,
    endCol: frozenColumnCount + scrollableEndCol,
  };
}

