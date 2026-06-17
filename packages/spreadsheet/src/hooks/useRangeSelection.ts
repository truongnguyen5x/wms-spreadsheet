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
  resolveCell?: (row: number, col: number) => ICellAddress;
  expandSelection?: (selection: ISelection) => ISelection;
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

function applySelectionTransforms(
  selection: ISelection,
  resolveCell?: (row: number, col: number) => ICellAddress,
  expandSelection?: (selection: ISelection) => ISelection,
): ISelection {
  const resolved: ISelection = {
    anchor: resolveCell
      ? resolveCell(selection.anchor.row, selection.anchor.col)
      : selection.anchor,
    focus: resolveCell
      ? resolveCell(selection.focus.row, selection.focus.col)
      : selection.focus,
  };
  return expandSelection ? expandSelection(resolved) : resolved;
}

export function useRangeSelection({
  initialCell = { row: 0, col: 0 },
  rowCount,
  columnCount,
  resolveCell,
  expandSelection,
}: IUseRangeSelectionOptions): IUseRangeSelectionResult {
  const [selection, setSelectionState] = useState<ISelection | null>(() =>
    createSelection(initialCell),
  );
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<TSelectionDragMode>("cell");
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<TSelectionDragMode>("cell");
  const setSelection = useCallback(
    (next: ISelection) => {
      setSelectionState(
        applySelectionTransforms(next, resolveCell, expandSelection),
      );
    },
    [resolveCell, expandSelection],
  );
  const handleCellMouseDown = useCallback(
    (row: number, col: number) => {
      dragModeRef.current = "cell";
      setDragMode("cell");
      isDraggingRef.current = true;
      setIsDragging(true);
      const cell = resolveCell ? resolveCell(row, col) : { row, col };
      setSelectionState(
        applySelectionTransforms(
          createSelection(cell),
          resolveCell,
          expandSelection,
        ),
      );
    },
    [resolveCell, expandSelection],
  );
  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isDraggingRef.current || dragModeRef.current !== "cell") return;
      const cell = resolveCell ? resolveCell(row, col) : { row, col };
      setSelectionState((prev) => {
        if (!prev) {
          return applySelectionTransforms(
            createSelection(cell),
            resolveCell,
            expandSelection,
          );
        }
        return applySelectionTransforms(
          { anchor: prev.anchor, focus: cell },
          resolveCell,
          expandSelection,
        );
      });
    },
    [resolveCell, expandSelection],
  );
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

