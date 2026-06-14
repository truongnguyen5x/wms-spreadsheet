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
): IVisibleRange {
  const startRow = Math.max(
    0,
    findIndexAtOffset(rowHeights, scrollTop) - overscan,
  );
  const endRow = Math.min(
    rowCount - 1,
    findIndexAtOffset(rowHeights, scrollTop + viewportHeight) + overscan,
  );
  const startCol = Math.max(
    0,
    findIndexAtOffset(columnWidths, scrollLeft) - overscan,
  );
  const endCol = Math.min(
    columnCount - 1,
    findIndexAtOffset(columnWidths, scrollLeft + viewportWidth) + overscan,
  );

  return { startRow, endRow, startCol, endCol };
}
