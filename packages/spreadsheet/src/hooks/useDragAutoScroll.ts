import { useCallback, useEffect, useRef, type RefObject } from "react";
import { pointerToCell } from "../utils/pointerToCell";

const EDGE_THRESHOLD = 40;
const MAX_SCROLL_SPEED = 16;

export interface IUseDragAutoScrollOptions {
  isDragging: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  rowHeight: number;
  columnWidth: number;
  rowCount: number;
  columnCount: number;
  onCellFocus: (row: number, col: number) => void;
}

function computeScrollSpeed(distance: number): number {
  const t = 1 - distance / EDGE_THRESHOLD;
  return Math.max(1, Math.round(t * MAX_SCROLL_SPEED));
}

function getEdgeScrollDeltas(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { scrollDx: number; scrollDy: number; nearEdge: boolean } {
  let scrollDx = 0;
  let scrollDy = 0;
  let nearEdge = false;

  const distTop = clientY - rect.top;
  const distBottom = rect.bottom - clientY;
  const distLeft = clientX - rect.left;
  const distRight = rect.right - clientX;

  if (clientY < rect.top) {
    scrollDy = -MAX_SCROLL_SPEED;
    nearEdge = true;
  } else if (distTop >= 0 && distTop < EDGE_THRESHOLD) {
    scrollDy = -computeScrollSpeed(distTop);
    nearEdge = true;
  }

  if (clientY > rect.bottom) {
    scrollDy = MAX_SCROLL_SPEED;
    nearEdge = true;
  } else if (distBottom >= 0 && distBottom < EDGE_THRESHOLD) {
    scrollDy = computeScrollSpeed(distBottom);
    nearEdge = true;
  }

  if (clientX < rect.left) {
    scrollDx = -MAX_SCROLL_SPEED;
    nearEdge = true;
  } else if (distLeft >= 0 && distLeft < EDGE_THRESHOLD) {
    scrollDx = -computeScrollSpeed(distLeft);
    nearEdge = true;
  }

  if (clientX > rect.right) {
    scrollDx = MAX_SCROLL_SPEED;
    nearEdge = true;
  } else if (distRight >= 0 && distRight < EDGE_THRESHOLD) {
    scrollDx = computeScrollSpeed(distRight);
    nearEdge = true;
  }

  return { scrollDx, scrollDy, nearEdge };
}

export function useDragAutoScroll({
  isDragging,
  scrollRef,
  rowHeight,
  columnWidth,
  rowCount,
  columnCount,
  onCellFocus,
}: IUseDragAutoScrollOptions): void {
  const pointerRef = useRef({ clientX: 0, clientY: 0 });
  const rafRef = useRef<number | null>(null);
  const onCellFocusRef = useRef(onCellFocus);

  useEffect(() => {
    onCellFocusRef.current = onCellFocus;
  }, [onCellFocus]);

  const tick = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      rafRef.current = null;
      return;
    }

    const { clientX, clientY } = pointerRef.current;
    const rect = el.getBoundingClientRect();
    const { scrollDx, scrollDy, nearEdge } = getEdgeScrollDeltas(
      clientX,
      clientY,
      rect,
    );

    if (scrollDx !== 0 || scrollDy !== 0) {
      const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, el.scrollLeft + scrollDx));
      el.scrollTop = Math.max(0, Math.min(maxScrollTop, el.scrollTop + scrollDy));
    }

    const cell = pointerToCell(
      clientX,
      clientY,
      el,
      rowHeight,
      columnWidth,
      rowCount,
      columnCount,
    );
    onCellFocusRef.current(cell.row, cell.col);

    if (nearEdge) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, [
    scrollRef,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
  ]);

  const scheduleTick = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => {
    if (!isDragging) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      pointerRef.current = { clientX: e.clientX, clientY: e.clientY };
      scheduleTick();
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDragging, scheduleTick]);
}
