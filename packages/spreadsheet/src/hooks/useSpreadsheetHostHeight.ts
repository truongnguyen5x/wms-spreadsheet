import { useLayoutEffect, useRef, useState, type RefObject } from "react";

function parentHasExplicitBoundedHeight(parent: HTMLElement): boolean {
  const style = getComputedStyle(parent);

  if (parseFloat(style.flexGrow) > 0) {
    return true;
  }

  if (parent.style.height && parent.style.height !== "auto") {
    return true;
  }

  return false;
}

function getParentHeightCap(parent: HTMLElement | null): number | null {
  if (!parent) return null;

  const style = getComputedStyle(parent);
  let cap = Infinity;

  if (style.maxHeight !== "none") {
    cap = Math.min(cap, parseFloat(style.maxHeight));
  }

  if (parent.style.maxHeight) {
    cap = Math.min(cap, parseFloat(parent.style.maxHeight));
  }

  return Number.isFinite(cap) ? cap : null;
}

function getFallbackHeightPx(container: HTMLElement): number {
  const top = container.getBoundingClientRect().top;
  const viewportAvailable = Math.max(0, window.innerHeight - top);
  const viewportCap = window.innerHeight;
  const parentCap = getParentHeightCap(container.parentElement);

  let height = Math.min(viewportAvailable, viewportCap);

  if (parentCap !== null) {
    height = Math.min(height, parentCap);
  }

  return Math.max(0, height);
}

export interface ISpreadsheetHostHeight {
  needsViewportFallback: boolean;
  fallbackHeightPx: number | null;
}

function getInitialState(): ISpreadsheetHostHeight {
  if (typeof window === "undefined") {
    return { needsViewportFallback: true, fallbackHeightPx: null };
  }
  return {
    needsViewportFallback: true,
    fallbackHeightPx: window.innerHeight,
  };
}

export function useSpreadsheetHostHeight(
  containerRef: RefObject<HTMLDivElement | null>,
): ISpreadsheetHostHeight {
  const [state, setState] = useState<ISpreadsheetHostHeight>(getInitialState);
  const lockedFallbackRef = useRef(true);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const parent = container.parentElement;
      const viewportCap = window.innerHeight * 1.5;
      const containerHeight = container.clientHeight;
      const parentHeight = parent?.clientHeight ?? 0;

      if (parent && parentHasExplicitBoundedHeight(parent)) {
        lockedFallbackRef.current = false;
        const next = {
          needsViewportFallback: false,
          fallbackHeightPx: null,
        };

        setState((prev) =>
          prev.needsViewportFallback === next.needsViewportFallback &&
          prev.fallbackHeightPx === next.fallbackHeightPx
            ? prev
            : next,
        );
        return;
      }

      if (
        containerHeight === 0 ||
        containerHeight > viewportCap ||
        parentHeight > viewportCap
      ) {
        lockedFallbackRef.current = true;
      }

      const needsFallback =
        lockedFallbackRef.current ||
        containerHeight === 0 ||
        parentHeight > viewportCap ||
        containerHeight > viewportCap;

      const fallbackHeightPx = needsFallback
        ? getFallbackHeightPx(container)
        : null;
      const next = { needsViewportFallback: needsFallback, fallbackHeightPx };

      setState((prev) =>
        prev.needsViewportFallback === next.needsViewportFallback &&
        prev.fallbackHeightPx === next.fallbackHeightPx
          ? prev
          : next,
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (container.parentElement) {
      observer.observe(container.parentElement);
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [containerRef]);

  return state;
}
