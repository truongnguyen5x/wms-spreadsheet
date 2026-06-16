import { useCallback, useEffect, type RefObject } from "react";
import type { CellStore } from "../store/CellStore";
import type { MetaStore } from "../store/MetaStore";
import type {
  ICellAddress,
  ICellInput,
  ISpreadsheetColumn,
  ISelection,
} from "../types";
import { clearSelectionValues } from "../utils/clearSelection";
import { createSelection, normalizeSelection } from "../utils/normalizeRange";
import { isCellDisabled, isCellEditable, resolveCellMeta } from "../utils/resolveCellMeta";

export interface IUseKeyboardNavigationOptions {
  rowCount: number;
  columnCount: number;
  selection: ISelection | null;
  editingCell: ICellAddress | null;
  setSelection: (selection: ISelection) => void;
  startEditing: (cell: ICellAddress, initialValue?: string) => void;
  stopEditing: () => void;
  store: CellStore;
  metaStore: MetaStore;
  columnsRef: RefObject<ISpreadsheetColumn[] | undefined>;
  visibleRowIndicesRef: RefObject<readonly number[]>;
  containerRef: RefObject<HTMLElement | null>;
  onChange?: (changes: ICellInput[]) => void;
  onCopy?: () => void;
  onPaste?: () => void;
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
  metaStore,
  columnsRef,
  visibleRowIndicesRef,
  containerRef,
  onChange,
  onCopy,
  onPaste,
}: IUseKeyboardNavigationOptions): void {
  const moveFocus = useCallback(
    (deltaRow: number, deltaCol: number) => {
      const focus = selection?.focus ?? { row: 0, col: 0 };
      const newRow = Math.max(0, Math.min(rowCount - 1, focus.row + deltaRow));
      const newCol = Math.max(
        0,
        Math.min(columnCount - 1, focus.col + deltaCol),
      );
      const newCell = { row: newRow, col: newCol };
      setSelection(createSelection(newCell));
    },
    [selection, rowCount, columnCount, setSelection],
  );
  const tryStartEditing = useCallback(
    (cell: ICellAddress, initialValue?: string) => {
      const meta = resolveCellMeta(
        metaStore,
        cell.row,
        cell.col,
        columnsRef.current ?? undefined,
      );
      if (!isCellEditable(meta)) return;
      startEditing(cell, initialValue);
    },
    [columnsRef, metaStore, startEditing],
  );
  const isWritableCell = useCallback(
    (row: number, col: number) => {
      const meta = resolveCellMeta(
        metaStore,
        row,
        col,
        columnsRef.current ?? undefined,
      );
      return !isCellDisabled(meta);
    },
    [columnsRef, metaStore],
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
          tryStartEditing(selection.focus);
          break;
        case "Tab":
          e.preventDefault();
          moveFocus(0, e.shiftKey ? -1 : 1);
          break;
        case "F2":
          e.preventDefault();
          tryStartEditing(selection.focus);
          break;
        case "Delete":
        case "Backspace": {
          e.preventDefault();
          const visibleRowIndices = visibleRowIndicesRef.current ?? [];
          const isFiltered = visibleRowIndices.length < rowCount;
          clearSelectionValues(
            store,
            normalizeSelection(selection),
            onChange,
            isWritableCell,
            isFiltered ? visibleRowIndices : undefined,
          );
          break;
        }
        default:
          if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            e.preventDefault();
            onCopy?.();
            break;
          }
          if ((e.ctrlKey || e.metaKey) && e.key === "v") {
            e.preventDefault();
            onPaste?.();
            break;
          }
          if (isPrintableKey(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const meta = resolveCellMeta(
              metaStore,
              selection.focus.row,
              selection.focus.col,
              columnsRef.current ?? undefined,
            );
            if (meta.type === "date") break;
            e.preventDefault();
            tryStartEditing(selection.focus, e.key);
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
    tryStartEditing,
    isWritableCell,
    containerRef,
    store,
    onChange,
    onCopy,
    onPaste,
    rowCount,
    visibleRowIndicesRef,
  ]);
}

