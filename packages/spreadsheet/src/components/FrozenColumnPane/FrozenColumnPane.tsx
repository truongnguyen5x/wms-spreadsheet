import { memo, type ReactNode, type Ref } from "react";
import type { CellStore } from "../../store/CellStore";
import type { MetaStore } from "../../store/MetaStore";
import type {
  ICustomCellDefinition,
  ISelection,
  ISpreadsheetColumn,
} from "../../types";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import { FrozenCellsLayer } from "./FrozenCellsLayer";
import styles from "../../styles/spreadsheet.module.scss";

export interface IFrozenColumnPaneProps {
  bodyRef: Ref<HTMLDivElement>;
  store: CellStore;
  metaStore: MetaStore;
  startRow: number;
  endRow: number;
  frozenColumnCount: number;
  dimensions: IGridDimensions;
  frozenWidth: number;
  scrollTop: number;
  totalHeight: number;
  isEditing: boolean;
  columns?: ISpreadsheetColumn[];
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  selection: ISelection | null;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
  selectionOverlay: ReactNode;
  clipboardOverlay: ReactNode;
  editor: ReactNode;
}

export const FrozenColumnPane = memo(function FrozenColumnPane({
  bodyRef,
  store,
  metaStore,
  startRow,
  endRow,
  frozenColumnCount,
  dimensions,
  frozenWidth,
  scrollTop,
  totalHeight,
  isEditing,
  columns,
  customCellRegistry,
  selection,
  onCellMouseDown,
  onCellMouseEnter,
  onCellDoubleClick,
  onBooleanToggle,
  selectionOverlay,
  clipboardOverlay,
  editor,
}: IFrozenColumnPaneProps) {
  return (
    <div
      ref={bodyRef}
      className={`${styles.frozenBodyPane}${isEditing ? ` ${styles.frozenBodyPaneEditing}` : ""}`}
      style={{ width: frozenWidth }}
    >
      <div
        className={styles.canvas}
        style={{
          width: frozenWidth,
          height: totalHeight,
          transform: `translateY(${-scrollTop}px)`,
        }}
      >
        <FrozenCellsLayer
          store={store}
          metaStore={metaStore}
          startRow={startRow}
          endRow={endRow}
          frozenColumnCount={frozenColumnCount}
          dimensions={dimensions}
          columns={columns}
          customCellRegistry={customCellRegistry}
          selection={selection}
          onCellMouseDown={onCellMouseDown}
          onCellMouseEnter={onCellMouseEnter}
          onCellDoubleClick={onCellDoubleClick}
          onBooleanToggle={onBooleanToggle}
        />
        {selectionOverlay}
        {clipboardOverlay}
        {editor}
      </div>
    </div>
  );
});
