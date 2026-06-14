import { useCallback, useEffect, useRef, useState } from "react";
import type { ICellAddress, ISelection } from "../types";
import {
  createColumnSelection,
  createRowSelection,
  createSelection,
} from "../utils/normalizeRange";

export type TSelectionDragMode = "cell" | "column" | "row";

export interface IUseRangeSelectionOptions {
  initialCell?: ICellAddress;
  rowCount: number;
  columnCount: number;
}

export interface IUseRangeSelectionResult {
  selection: ISelection | null;
  setSelection: (selection: ISelection) => void;
  handleCellMouseDown: (row: number, col: number) => void;
  handleCellMouseEnter: (row: number, col: number) => void;
  handleColumnHeaderMouseDown: (col: number) => void;
  handleColumnHeaderMouseEnter: (col: number) => void;
  handleRowHeaderMouseDown: (row: number) => void;
  handleRowHeaderMouseEnter: (row: number) => void;
  isDragging: boolean;
  dragMode: TSelectionDragMode;
}

export function useRangeSelection({
  initialCell = { row: 0, col: 0 },
  rowCount,
  columnCount,
}: IUseRangeSelectionOptions): IUseRangeSelectionResult {
  const [selection, setSelectionState] = useState<ISelection | null>(() =>
    createSelection(initialCell),
  );
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<TSelectionDragMode>("cell");
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<TSelectionDragMode>("cell");

  const setSelection = useCallback((next: ISelection) => {
    setSelectionState(next);
  }, []);

  const handleCellMouseDown = useCallback((row: number, col: number) => {
    dragModeRef.current = "cell";
    setDragMode("cell");
    isDraggingRef.current = true;
    setIsDragging(true);
    setSelectionState(createSelection({ row, col }));
  }, []);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isDraggingRef.current || dragModeRef.current !== "cell") return;
    setSelectionState((prev) => {
      if (!prev) return createSelection({ row, col });
      return { anchor: prev.anchor, focus: { row, col } };
    });
  }, []);

  const handleColumnHeaderMouseDown = useCallback(
    (col: number) => {
      dragModeRef.current = "column";
      setDragMode("column");
      isDraggingRef.current = true;
      setIsDragging(true);
      setSelectionState(createColumnSelection(col, rowCount));
    },
    [rowCount],
  );

  const handleColumnHeaderMouseEnter = useCallback(
    (col: number) => {
      if (!isDraggingRef.current || dragModeRef.current !== "column") return;
      setSelectionState((prev) => {
        if (!prev) return createColumnSelection(col, rowCount);
        return {
          anchor: prev.anchor,
          focus: { row: rowCount - 1, col },
        };
      });
    },
    [rowCount],
  );

  const handleRowHeaderMouseDown = useCallback(
    (row: number) => {
      dragModeRef.current = "row";
      setDragMode("row");
      isDraggingRef.current = true;
      setIsDragging(true);
      setSelectionState(createRowSelection(row, columnCount));
    },
    [columnCount],
  );

  const handleRowHeaderMouseEnter = useCallback(
    (row: number) => {
      if (!isDraggingRef.current || dragModeRef.current !== "row") return;
      setSelectionState((prev) => {
        if (!prev) return createRowSelection(row, columnCount);
        return {
          anchor: prev.anchor,
          focus: { row, col: columnCount - 1 },
        };
      });
    },
    [columnCount],
  );

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return {
    selection,
    setSelection,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleColumnHeaderMouseDown,
    handleColumnHeaderMouseEnter,
    handleRowHeaderMouseDown,
    handleRowHeaderMouseEnter,
    isDragging,
    dragMode,
  };
}
