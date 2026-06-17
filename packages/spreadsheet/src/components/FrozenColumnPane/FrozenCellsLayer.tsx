import { memo, useCallback, useMemo } from "react";
import type { CellStore } from "../../store/CellStore";
import type { MetaStore } from "../../store/MetaStore";
import type { MergeStore } from "../../store/MergeStore";
import type {
  ICustomCellDefinition,
  ISpreadsheetColumn,
} from "../../types";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import { renderCells } from "../../utils/renderCells";

export interface IFrozenCellsLayerProps {
  store: CellStore;
  metaStore: MetaStore;
  mergeStore: MergeStore;
  startRow: number;
  endRow: number;
  frozenColumnCount: number;
  dimensions: IGridDimensions;
  columns?: ISpreadsheetColumn[];
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  resolvePhysicalRow?: (displayRow: number) => number;
  getRowTop?: (displayRow: number) => number;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
}

export const FrozenCellsLayer = memo(function FrozenCellsLayer({
  store,
  metaStore,
  mergeStore,
  startRow,
  endRow,
  frozenColumnCount,
  dimensions,
  columns,
  customCellRegistry,
  resolvePhysicalRow,
  getRowTop,
  onCellMouseDown,
  onCellMouseEnter,
  onCellDoubleClick,
  onBooleanToggle,
}: IFrozenCellsLayerProps) {
  const getColumnLeft = useCallback(
    (col: number) => dimensions.getColumnLeft(col),
    [dimensions],
  );
  const cells = useMemo(
    () =>
      renderCells({
        store,
        metaStore,
        mergeStore,
        dimensions,
        rowStart: startRow,
        rowEnd: endRow,
        colStart: 0,
        colEnd: frozenColumnCount - 1,
        columns,
        customCellRegistry,
        getColumnLeft,
        resolvePhysicalRow,
        getRowTop,
        onCellMouseDown,
        onCellMouseEnter,
        onCellDoubleClick,
        onBooleanToggle,
      }),
    [
      store,
      metaStore,
      mergeStore,
      dimensions.columnWidths,
      dimensions.rowHeights,
      startRow,
      endRow,
      frozenColumnCount,
      columns,
      customCellRegistry,
      getColumnLeft,
      resolvePhysicalRow,
      getRowTop,
      onCellMouseDown,
      onCellMouseEnter,
      onCellDoubleClick,
      onBooleanToggle,
    ],
  );
  return <>{cells}</>;
});
