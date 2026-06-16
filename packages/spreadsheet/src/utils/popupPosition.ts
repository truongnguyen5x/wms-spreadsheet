export interface IPopupPosition {
  top: number;
  left: number;
  width: number;
}

const DEFAULT_GAP = 2;

export function computePopupPosition(
  anchorRect: DOMRect,
  popupHeight: number,
  minWidth: number,
): IPopupPosition {
  const popupWidth = Math.max(minWidth, anchorRect.width);
  let top = anchorRect.bottom + DEFAULT_GAP;

  if (top + popupHeight > window.innerHeight) {
    top = anchorRect.top - popupHeight - DEFAULT_GAP;
  }
  top = Math.max(0, top);

  let left = anchorRect.left;
  if (left + popupWidth > window.innerWidth) {
    left = Math.max(0, window.innerWidth - popupWidth);
  }

  return {
    top,
    left,
    width: popupWidth,
  };
}
