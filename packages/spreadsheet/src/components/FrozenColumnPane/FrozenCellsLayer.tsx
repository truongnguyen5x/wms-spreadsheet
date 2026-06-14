import { memo, useCallback, useMemo } from "react";
import type { CellStore } from "../../store/CellStore";
import type { MetaStore } from "../../store/MetaStore";
import type {
  ICustomCellDefinition,
  ISelection,
  ISpreadsheetColumn,
} from "../../types";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import { renderCells } from "../../utils/renderCells";

export interface IFrozenCellsLayerProps {
  store: CellStore;
  metaStore: MetaStore;
  startRow: number;
  endRow: number;
  frozenColumnCount: number;
  dimensions: IGridDimensions;
  columns?: ISpreadsheetColumn[];
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  selection: ISelection | null;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
}

export const FrozenCellsLayer = memo(function FrozenCellsLayer({
  store,
  metaStore,
  startRow,
  endRow,
  frozenColumnCount,
  dimensions,
  columns,
  customCellRegistry,
  selection,
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
        dimensions,
        rowStart: startRow,
        rowEnd: endRow,
        colStart: 0,
        colEnd: frozenColumnCount - 1,
        columns,
        customCellRegistry,
        selection,
        getColumnLeft,
        onCellMouseDown,
        onCellMouseEnter,
        onCellDoubleClick,
        onBooleanToggle,
      }),
    [
      store,
      metaStore,
      dimensions.columnWidths,
      dimensions.rowHeights,
      startRow,
      endRow,
      frozenColumnCount,
      columns,
      customCellRegistry,
      selection,
      getColumnLeft,
      onCellMouseDown,
      onCellMouseEnter,
      onCellDoubleClick,
      onBooleanToggle,
    ],
  );
  return <>{cells}</>;
});
