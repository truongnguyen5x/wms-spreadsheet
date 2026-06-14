import { useCallback, useEffect, type RefObject } from "react";
import type { CellStore } from "../store/CellStore";
import type { ICellAddress } from "../types";

export interface IUseKeyboardNavigationOptions {
  rowCount: number;
  columnCount: number;
  activeCell: ICellAddress | null;
  editingCell: ICellAddress | null;
  setActiveCell: (cell: ICellAddress) => void;
  startEditing: (cell: ICellAddress, initialValue?: string) => void;
  stopEditing: () => void;
  store: CellStore;
  containerRef: RefObject<HTMLElement | null>;
  onAfterCommit?: (row: number, col: number, direction: "down" | "right") => void;
}

function isPrintableKey(key: string): boolean {
  return key.length === 1 && !key.startsWith("Arrow");
}

export function useKeyboardNavigation({
  rowCount,
  columnCount,
  activeCell,
  editingCell,
  setActiveCell,
  startEditing,
  stopEditing,
  store,
  containerRef,
  onAfterCommit,
}: IUseKeyboardNavigationOptions): void {
  const moveActive = useCallback(
    (deltaRow: number, deltaCol: number) => {
      if (!activeCell) {
        setActiveCell({ row: 0, col: 0 });
        return;
      }
      const newRow = Math.max(
        0,
        Math.min(rowCount - 1, activeCell.row + deltaRow),
      );
      const newCol = Math.max(
        0,
        Math.min(columnCount - 1, activeCell.col + deltaCol),
      );
      setActiveCell({ row: newRow, col: newCol });
    },
    [activeCell, rowCount, columnCount, setActiveCell],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;

      if (!activeCell) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          moveActive(-1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveActive(1, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          moveActive(0, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveActive(0, 1);
          break;
        case "Enter":
          e.preventDefault();
          startEditing(activeCell);
          break;
        case "Tab":
          e.preventDefault();
          moveActive(0, e.shiftKey ? -1 : 1);
          break;
        case "F2":
          e.preventDefault();
          startEditing(activeCell);
          break;
        default:
          if (isPrintableKey(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            startEditing(activeCell, e.key);
          }
          break;
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [
    activeCell,
    editingCell,
    moveActive,
    startEditing,
    stopEditing,
    containerRef,
    store,
    onAfterCommit,
  ]);
}
