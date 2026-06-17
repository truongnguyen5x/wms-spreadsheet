import { memo } from "react";
import type { CellStore } from "../../store/CellStore";
import type { MetaStore } from "../../store/MetaStore";
import type { ICustomCellDefinition, ISpreadsheetColumn } from "../../types";
import { useCellValue } from "../../hooks/useCellValue";
import { useCellMeta } from "../../hooks/useCellMeta";
import { resolveCellMeta } from "../../utils/resolveCellMeta";
import { getCellAlignmentStyle } from "../../utils/cellAlignment";
import { renderCellContent } from "../../utils/cellTypeRegistry";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISpreadsheetCellProps {
  store: CellStore;
  metaStore: MetaStore;
  row: number;
  col: number;
  columns?: ISpreadsheetColumn[];
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  isActive: boolean;
  isMerged?: boolean;
  top: number;
  left: number;
  width: number;
  height: number;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onDoubleClick: (row: number, col: number) => void;
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
}

export const SpreadsheetCell = memo(function SpreadsheetCell({
  store,
  metaStore,
  row,
  col,
  columns,
  customCellRegistry,
  isActive,
  isMerged = false,
  top,
  left,
  width,
  height,
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
  onBooleanToggle,
}: ISpreadsheetCellProps) {
  const value = useCellValue(store, row, col);
  useCellMeta(metaStore, row, col);
  const meta = resolveCellMeta(metaStore, row, col, columns);
  const column = columns?.[col];
  const stateClass = meta.disabled
    ? styles.disabled
    : meta.invalid
      ? styles.invalid
      : "";
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onMouseDown(row, col);
  };

  return (
    <div
      className={`${styles.cell} ${isActive ? styles.active : ""} ${isMerged ? styles.mergedAnchor : ""} ${stateClass}`}
      style={{ top, left, width, height, ...getCellAlignmentStyle(column) }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onMouseEnter(row, col)}
      onDoubleClick={() => onDoubleClick(row, col)}
      role="gridcell"
    >
      {renderCellContent({
        params: { row, col, value, meta, isActive },
        column,
        customCellRegistry,
        onBooleanToggle,
      })}
    </div>
  );
});

