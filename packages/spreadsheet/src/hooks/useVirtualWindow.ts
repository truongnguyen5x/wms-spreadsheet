import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeVisibleRange, type IVisibleRange } from "../utils/computeVisibleRange";
import { getFrozenWidth } from "../utils/frozenColumns";
import { getTotalSize } from "../utils/gridDimensions";

export interface IUseVirtualWindowOptions {
  rowCount: number;
  columnCount: number;
  rowHeights: readonly number[];
  columnWidths: readonly number[];
  overscan: number;
  frozenColumnCount?: number;
}

export interface IVirtualWindowState {
  scrollRef: React.RefObject<HTMLDivElement>;
  scrollTop: number;
  scrollLeft: number;
  viewportWidth: number;
  viewportHeight: number;
  visibleRange: IVisibleRange;
  totalWidth: number;
  scrollableTotalWidth: number;
  totalHeight: number;
  frozenColumnCount: number;
  frozenWidth: number;
}

export function useVirtualWindow(
  options: IUseVirtualWindowOptions,
): IVirtualWindowState {
  const {
    rowCount,
    columnCount,
    rowHeights,
    columnWidths,
    overscan,
    frozenColumnCount = 0,
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const scrollPendingRef = useRef({ scrollTop: 0, scrollLeft: 0 });

  const [state, setState] = useState(() => ({
    scrollTop: 0,
    scrollLeft: 0,
    viewportWidth: 0,
    viewportHeight: 0,
  }));

  const totalWidth = getTotalSize(columnWidths);
  const frozenWidth = getFrozenWidth(columnWidths, frozenColumnCount);
  const scrollableTotalWidth = Math.max(0, totalWidth - frozenWidth);
  const totalHeight = getTotalSize(rowHeights);

  const visibleRange = useMemo(
    () =>
      computeVisibleRange(
        state.scrollTop,
        state.scrollLeft,
        state.viewportHeight,
        state.viewportWidth,
        rowHeights,
        columnWidths,
        rowCount,
        columnCount,
        overscan,
        frozenColumnCount,
      ),
    [
      state.scrollTop,
      state.scrollLeft,
      state.viewportHeight,
      state.viewportWidth,
      rowHeights,
      columnWidths,
      rowCount,
      columnCount,
      overscan,
      frozenColumnCount,
    ],
  );

  const flushScroll = useCallback(() => {
    rafRef.current = null;
    const { scrollTop, scrollLeft } = scrollPendingRef.current;
    setState((prev) => {
      if (prev.scrollTop === scrollTop && prev.scrollLeft === scrollLeft) {
        return prev;
      }
      return { ...prev, scrollTop, scrollLeft };
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    scrollPendingRef.current = {
      scrollTop: el.scrollTop,
      scrollLeft: el.scrollLeft,
    };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(flushScroll);
    }
  }, [flushScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateViewport = () => {
      setState((prev) => ({
        ...prev,
        viewportWidth: el.clientWidth,
        viewportHeight: el.clientHeight,
        scrollTop: el.scrollTop,
        scrollLeft: el.scrollLeft,
      }));
    };

    updateViewport();

    const observer = new ResizeObserver(updateViewport);
    observer.observe(el);

    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return {
    scrollRef,
    scrollTop: state.scrollTop,
    scrollLeft: state.scrollLeft,
    viewportWidth: state.viewportWidth,
    viewportHeight: state.viewportHeight,
    visibleRange,
    totalWidth,
    scrollableTotalWidth,
    totalHeight,
    frozenColumnCount,
    frozenWidth,
  };
}
