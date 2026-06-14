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
  rowHeight: number,
  columnWidth: number,
  rowCount: number,
  columnCount: number,
  overscan = 3,
): IVisibleRange {
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    rowCount - 1,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan,
  );
  const startCol = Math.max(0, Math.floor(scrollLeft / columnWidth) - overscan);
  const endCol = Math.min(
    columnCount - 1,
    Math.ceil((scrollLeft + viewportWidth) / columnWidth) + overscan,
  );

  return { startRow, endRow, startCol, endCol };
}
