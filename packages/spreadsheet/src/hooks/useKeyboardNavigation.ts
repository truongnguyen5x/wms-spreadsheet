import { useCallback, useEffect, type RefObject } from "react";
import type { CellStore } from "../store/CellStore";
import type { ICellAddress, ISelection } from "../types";
import { clearSelectionValues } from "../utils/clearSelection";
import { createSelection, normalizeSelection } from "../utils/normalizeRange";

export interface IUseKeyboardNavigationOptions {
  rowCount: number;
  columnCount: number;
  selection: ISelection | null;
  editingCell: ICellAddress | null;
  setSelection: (selection: ISelection) => void;
  startEditing: (cell: ICellAddress, initialValue?: string) => void;
  stopEditing: () => void;
  store: CellStore;
  containerRef: RefObject<HTMLElement | null>;
  onCellChange?: (row: number, col: number, value: string) => void;
}

function isPrintableKey(key: string): boolean {
  return key.length === 1 && !key.startsWith("Arrow");
}

export function useKeyboardNavigation({
  rowCount,
  columnCount,
  selection,
  editingCell,
  setSelection,
  startEditing,
  store,
  containerRef,
  onCellChange,
}: IUseKeyboardNavigationOptions): void {
  const moveFocus = useCallback(
    (deltaRow: number, deltaCol: number) => {
      const focus = selection?.focus ?? { row: 0, col: 0 };
      const newRow = Math.max(0, Math.min(rowCount - 1, focus.row + deltaRow));
      const newCol = Math.max(0, Math.min(columnCount - 1, focus.col + deltaCol));
      const newCell = { row: newRow, col: newCol };
      setSelection(createSelection(newCell));
    },
    [selection, rowCount, columnCount, setSelection],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;
      if (!selection) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveFocus(-1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveFocus(1, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveFocus(0, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveFocus(0, 1);
          break;
        case "Enter":
          e.preventDefault();
          startEditing(selection.focus);
          break;
        case "Tab":
          e.preventDefault();
          moveFocus(0, e.shiftKey ? -1 : 1);
          break;
        case "F2":
          e.preventDefault();
          startEditing(selection.focus);
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          clearSelectionValues(
            store,
            normalizeSelection(selection),
            onCellChange,
          );
          break;
        default:
          if (isPrintableKey(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            startEditing(selection.focus, e.key);
          }
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [
    selection,
    editingCell,
    moveFocus,
    startEditing,
    containerRef,
    store,
    onCellChange,
  ]);
}
