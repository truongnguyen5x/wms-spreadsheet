import { useCallback, useEffect, useRef, useState } from "react";
import type { ICellAddress, ISelection } from "../types";
import { createSelection } from "../utils/normalizeRange";

export interface IUseRangeSelectionResult {
  selection: ISelection | null;
  setSelection: (selection: ISelection) => void;
  handleCellMouseDown: (row: number, col: number) => void;
  handleCellMouseEnter: (row: number, col: number) => void;
  isDragging: boolean;
}

export function useRangeSelection(
  initialCell: ICellAddress = { row: 0, col: 0 },
): IUseRangeSelectionResult {
  const [selection, setSelectionState] = useState<ISelection | null>(() =>
    createSelection(initialCell),
  );
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const setSelection = useCallback((next: ISelection) => {
    setSelectionState(next);
  }, []);

  const handleCellMouseDown = useCallback((row: number, col: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setSelectionState(createSelection({ row, col }));
  }, []);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isDraggingRef.current) return;
    setSelectionState((prev) => {
      if (!prev) return createSelection({ row, col });
      return { anchor: prev.anchor, focus: { row, col } };
    });
  }, []);

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
    isDragging,
  };
}
