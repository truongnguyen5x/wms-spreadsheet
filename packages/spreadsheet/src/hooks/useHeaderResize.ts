import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IResizeHandle, TResizeAxis } from "../types";
import type { IGridDimensions } from "./useGridDimensions";

export interface IUseHeaderResizeOptions {
  dimensions: IGridDimensions;
  onColumnResize?: (col: number, width: number) => void;
  onRowResize?: (row: number, height: number) => void;
}

export interface IUseHeaderResizeResult {
  hoveredHandle: IResizeHandle | null;
  isResizing: boolean;
  onResizeHandleMouseEnter: (handle: IResizeHandle) => void;
  onResizeHandleMouseLeave: () => void;
  onResizeStart: (axis: TResizeAxis, index: number, clientPos: number) => void;
}

export function useHeaderResize({
  dimensions,
  onColumnResize,
  onRowResize,
}: IUseHeaderResizeOptions): IUseHeaderResizeResult {
  const [hoveredHandle, setHoveredHandle] = useState<IResizeHandle | null>(
    null,
  );
  const [isResizing, setIsResizing] = useState(false);
  const resizeStateRef = useRef<{
    axis: TResizeAxis;
    index: number;
    startPos: number;
    startSize: number;
  } | null>(null);
  const dimensionsRef = useRef(dimensions);
  const onColumnResizeRef = useRef(onColumnResize);
  const onRowResizeRef = useRef(onRowResize);
  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);
  useEffect(() => {
    onColumnResizeRef.current = onColumnResize;
  }, [onColumnResize]);
  useEffect(() => {
    onRowResizeRef.current = onRowResize;
  }, [onRowResize]);
  const onResizeHandleMouseEnter = useCallback((handle: IResizeHandle) => {
    setHoveredHandle(handle);
  }, []);
  const onResizeHandleMouseLeave = useCallback(() => {
    if (!resizeStateRef.current) {
      setHoveredHandle(null);
    }
  }, []);
  const onResizeStart = useCallback(
    (axis: TResizeAxis, index: number, clientPos: number) => {
      const startSize =
        axis === "column"
          ? dimensionsRef.current.getColumnWidth(index)
          : dimensionsRef.current.getRowHeight(index);
      resizeStateRef.current = {
        axis,
        index,
        startPos: clientPos,
        startSize,
      };
      setHoveredHandle({ axis, index });
      setIsResizing(true);
    },
    [],
  );
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      document.body.style.cursor =
        state.axis === "column" ? "col-resize" : "row-resize";
      const delta =
        state.axis === "column"
          ? e.clientX - state.startPos
          : e.clientY - state.startPos;
      const nextSize = state.startSize + delta;
      if (state.axis === "column") {
        dimensionsRef.current.setColumnWidth(state.index, nextSize);
      } else {
        dimensionsRef.current.setRowHeightManual(state.index, nextSize);
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = "";
      const state = resizeStateRef.current;
      if (state) {
        if (state.axis === "column") {
          onColumnResizeRef.current?.(
            state.index,
            dimensionsRef.current.getColumnWidth(state.index),
          );
        } else {
          onRowResizeRef.current?.(
            state.index,
            dimensionsRef.current.getRowHeight(state.index),
          );
        }
      }
      resizeStateRef.current = null;
      setIsResizing(false);
      setHoveredHandle(null);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);
  return useMemo(
    () => ({
      hoveredHandle,
      isResizing,
      onResizeHandleMouseEnter,
      onResizeHandleMouseLeave,
      onResizeStart,
    }),
    [
      hoveredHandle,
      isResizing,
      onResizeHandleMouseEnter,
      onResizeHandleMouseLeave,
      onResizeStart,
    ],
  );
}

