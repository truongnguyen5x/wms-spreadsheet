import { memo, type ReactNode, type Ref } from "react";
import type { CellStore } from "../../store/CellStore";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import { FrozenCellsLayer } from "./FrozenCellsLayer";
import styles from "../../styles/spreadsheet.module.scss";

export interface IFrozenColumnPaneProps {
  bodyRef: Ref<HTMLDivElement>;
  store: CellStore;
  startRow: number;
  endRow: number;
  frozenColumnCount: number;
  dimensions: IGridDimensions;
  frozenWidth: number;
  scrollTop: number;
  totalHeight: number;
  isEditing: boolean;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  selectionOverlay: ReactNode;
  clipboardOverlay: ReactNode;
  editor: ReactNode;
}

export const FrozenColumnPane = memo(function FrozenColumnPane({
  bodyRef,
  store,
  startRow,
  endRow,
  frozenColumnCount,
  dimensions,
  frozenWidth,
  scrollTop,
  totalHeight,
  isEditing,
  onCellMouseDown,
  onCellMouseEnter,
  onCellDoubleClick,
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
          startRow={startRow}
          endRow={endRow}
          frozenColumnCount={frozenColumnCount}
          dimensions={dimensions}
          onCellMouseDown={onCellMouseDown}
          onCellMouseEnter={onCellMouseEnter}
          onCellDoubleClick={onCellDoubleClick}
        />
        {selectionOverlay}
        {clipboardOverlay}
        {editor}
      </div>
    </div>
  );
});
