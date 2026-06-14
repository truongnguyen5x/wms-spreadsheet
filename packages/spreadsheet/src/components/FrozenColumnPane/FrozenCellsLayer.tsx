import { memo, useCallback, useMemo } from "react";
import type { CellStore } from "../../store/CellStore";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import { renderCells } from "../../utils/renderCells";

export interface IFrozenCellsLayerProps {
  store: CellStore;
  startRow: number;
  endRow: number;
  frozenColumnCount: number;
  dimensions: IGridDimensions;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
}

export const FrozenCellsLayer = memo(function FrozenCellsLayer({
  store,
  startRow,
  endRow,
  frozenColumnCount,
  dimensions,
  onCellMouseDown,
  onCellMouseEnter,
  onCellDoubleClick,
}: IFrozenCellsLayerProps) {
  const getColumnLeft = useCallback(
    (col: number) => dimensions.getColumnLeft(col),
    [dimensions],
  );

  const cells = useMemo(
    () =>
      renderCells(
        store,
        dimensions,
        startRow,
        endRow,
        0,
        frozenColumnCount - 1,
        getColumnLeft,
        onCellMouseDown,
        onCellMouseEnter,
        onCellDoubleClick,
      ),
    [
      store,
      dimensions.columnWidths,
      dimensions.rowHeights,
      startRow,
      endRow,
      frozenColumnCount,
      getColumnLeft,
      onCellMouseDown,
      onCellMouseEnter,
      onCellDoubleClick,
    ],
  );

  return <>{cells}</>;
});
