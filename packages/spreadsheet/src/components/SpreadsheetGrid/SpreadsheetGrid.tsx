import { memo, useCallback, useEffect, useMemo } from "react";
import type { CellStore } from "../../store/CellStore";
import type { ICellAddress } from "../../types";
import { useVirtualWindow } from "../../hooks/useVirtualWindow";
import { CornerCell } from "../CornerCell";
import { ColumnHeaderRow } from "../ColumnHeaderRow";
import { RowHeaderColumn } from "../RowHeaderColumn";
import { SpreadsheetCell } from "../SpreadsheetCell";
import { CellEditor } from "../CellEditor";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISpreadsheetGridProps {
  store: CellStore;
  rowCount: number;
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  overscan: number;
  activeCell: ICellAddress | null;
  editingCell: ICellAddress | null;
  onCellClick: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onCommitEdit: (
    row: number,
    col: number,
    value: string,
    direction: "stay" | "down" | "right",
  ) => void;
  onCancelEdit: () => void;
}

export const SpreadsheetGrid = memo(function SpreadsheetGrid({
  store,
  rowCount,
  columnCount,
  rowHeight,
  columnWidth,
  overscan,
  activeCell,
  editingCell,
  onCellClick,
  onCellDoubleClick,
  onCommitEdit,
  onCancelEdit,
}: ISpreadsheetGridProps) {
  const virtual = useVirtualWindow({
    rowCount,
    columnCount,
    rowHeight,
    columnWidth,
    overscan,
  });

  const { visibleRange, scrollTop, scrollLeft, totalWidth, totalHeight } =
    virtual;

  useEffect(() => {
    if (!activeCell) return;
    const el = virtual.scrollRef.current;
    if (!el) return;

    const cellTop = activeCell.row * rowHeight;
    const cellLeft = activeCell.col * columnWidth;
    const cellBottom = cellTop + rowHeight;
    const cellRight = cellLeft + columnWidth;

    const viewTop = el.scrollTop;
    const viewLeft = el.scrollLeft;
    const viewBottom = viewTop + el.clientHeight;
    const viewRight = viewLeft + el.clientWidth;

    if (cellTop < viewTop) {
      el.scrollTop = cellTop;
    } else if (cellBottom > viewBottom) {
      el.scrollTop = cellBottom - el.clientHeight;
    }

    if (cellLeft < viewLeft) {
      el.scrollLeft = cellLeft;
    } else if (cellRight > viewRight) {
      el.scrollLeft = cellRight - el.clientWidth;
    }
  }, [activeCell, rowHeight, columnWidth, virtual.scrollRef]);

  const cells = useMemo(() => {
    const result: React.ReactNode[] = [];
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        const isActive =
          activeCell?.row === row && activeCell?.col === col;
        result.push(
          <SpreadsheetCell
            key={`${row}:${col}`}
            store={store}
            row={row}
            col={col}
            isActive={isActive}
            top={row * rowHeight}
            left={col * columnWidth}
            width={columnWidth}
            height={rowHeight}
            onClick={onCellClick}
            onDoubleClick={onCellDoubleClick}
          />,
        );
      }
    }
    return result;
  }, [
    visibleRange,
    activeCell,
    store,
    rowHeight,
    columnWidth,
    onCellClick,
    onCellDoubleClick,
  ]);

  const handleCommit = useCallback(
    (value: string, direction: "stay" | "down" | "right") => {
      if (!editingCell) return;
      onCommitEdit(editingCell.row, editingCell.col, value, direction);
    },
    [editingCell, onCommitEdit],
  );

  const editorOverlay =
    editingCell !== null ? (
      <CellEditor
        row={editingCell.row}
        col={editingCell.col}
        value={store.getValue(editingCell.row, editingCell.col)}
        top={editingCell.row * rowHeight}
        left={editingCell.col * columnWidth}
        width={columnWidth}
        height={rowHeight}
        onCommit={handleCommit}
        onCancel={onCancelEdit}
      />
    ) : null;

  return (
    <div className={styles.spreadsheet} role="grid">
      <div className={styles.topRow}>
        <CornerCell />
        <ColumnHeaderRow
          visibleRange={visibleRange}
          columnWidth={columnWidth}
          scrollLeft={scrollLeft}
          totalWidth={totalWidth}
          activeCol={activeCell?.col ?? null}
        />
      </div>
      <div className={styles.bottomRow}>
        <RowHeaderColumn
          visibleRange={visibleRange}
          rowHeight={rowHeight}
          scrollTop={scrollTop}
          totalHeight={totalHeight}
          activeRow={activeCell?.row ?? null}
        />
        <div ref={virtual.scrollRef} className={styles.bodyScroll}>
          <div
            className={styles.canvas}
            style={{ width: totalWidth, height: totalHeight }}
          >
            {cells}
            {editorOverlay}
          </div>
        </div>
      </div>
    </div>
  );
});
