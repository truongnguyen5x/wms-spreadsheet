import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MIN_COLUMN_WIDTH,
  MIN_ROW_HEIGHT,
} from "../types";
import {
  getOffsetAtIndex,
  getTotalSize,
  resizeArray,
} from "../utils/gridDimensions";

export interface IGridDimensions {
  columnWidths: readonly number[];
  rowHeights: readonly number[];
  getColumnLeft: (col: number) => number;
  getRowTop: (row: number) => number;
  getColumnWidth: (col: number) => number;
  getRowHeight: (row: number) => number;
  totalWidth: number;
  totalHeight: number;
  setColumnWidth: (col: number, width: number) => void;
  setRowHeight: (row: number, height: number) => void;
}

export interface IUseGridDimensionsOptions {
  rowCount: number;
  columnCount: number;
  defaultRowHeight: number;
  defaultColumnWidth: number;
}

export function useGridDimensions({
  rowCount,
  columnCount,
  defaultRowHeight,
  defaultColumnWidth,
}: IUseGridDimensionsOptions): IGridDimensions {
  const [columnWidths, setColumnWidths] = useState<number[]>(() =>
    Array.from({ length: columnCount }, () => defaultColumnWidth),
  );
  const [rowHeights, setRowHeights] = useState<number[]>(() =>
    Array.from({ length: rowCount }, () => defaultRowHeight),
  );

  useEffect(() => {
    setColumnWidths((prev) =>
      resizeArray(prev, columnCount, defaultColumnWidth),
    );
  }, [columnCount, defaultColumnWidth]);

  useEffect(() => {
    setRowHeights((prev) => resizeArray(prev, rowCount, defaultRowHeight));
  }, [rowCount, defaultRowHeight]);

  const getColumnLeft = useCallback(
    (col: number) => getOffsetAtIndex(columnWidths, col),
    [columnWidths],
  );

  const getRowTop = useCallback(
    (row: number) => getOffsetAtIndex(rowHeights, row),
    [rowHeights],
  );

  const getColumnWidth = useCallback(
    (col: number) => columnWidths[col] ?? defaultColumnWidth,
    [columnWidths, defaultColumnWidth],
  );

  const getRowHeight = useCallback(
    (row: number) => rowHeights[row] ?? defaultRowHeight,
    [rowHeights, defaultRowHeight],
  );

  const setColumnWidth = useCallback((col: number, width: number) => {
    const nextWidth = Math.max(MIN_COLUMN_WIDTH, width);
    setColumnWidths((prev) => {
      if (prev[col] === nextWidth) return prev;
      const next = [...prev];
      next[col] = nextWidth;
      return next;
    });
  }, []);

  const setRowHeight = useCallback((row: number, height: number) => {
    const nextHeight = Math.max(MIN_ROW_HEIGHT, height);
    setRowHeights((prev) => {
      if (prev[row] === nextHeight) return prev;
      const next = [...prev];
      next[row] = nextHeight;
      return next;
    });
  }, []);

  const totalWidth = useMemo(
    () => getTotalSize(columnWidths),
    [columnWidths],
  );
  const totalHeight = useMemo(() => getTotalSize(rowHeights), [rowHeights]);

  return {
    columnWidths,
    rowHeights,
    getColumnLeft,
    getRowTop,
    getColumnWidth,
    getRowHeight,
    totalWidth,
    totalHeight,
    setColumnWidth,
    setRowHeight,
  };
}
