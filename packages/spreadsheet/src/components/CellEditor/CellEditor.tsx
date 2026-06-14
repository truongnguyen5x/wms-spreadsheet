import { useCallback, useEffect, useRef } from "react";
import {
  CELL_EDITOR_VERTICAL_CHROME,
  CELL_LINE_HEIGHT,
  type ICommitDirection,
} from "../../types";
import styles from "../../styles/spreadsheet.module.scss";

export type { ICommitDirection };
export interface ICellEditorProps {
  row: number;
  col: number;
  value: string;
  top: number;
  left: number;
  width: number;
  height: number;
  onCommit: (value: string, direction: ICommitDirection) => void;
  onCancel: () => void;
}

function measureEditorHeight(value: string, rowHeight: number): number {
  const lineCount = Math.max(1, value.split("\n").length);
  if (lineCount === 1) return rowHeight;
  return lineCount * CELL_LINE_HEIGHT + CELL_EDITOR_VERTICAL_CHROME;
}

export function CellEditor({
  value,
  top,
  left,
  width,
  height,
  onCommit,
  onCancel,
}: ICellEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftRef = useRef(value);
  const committedRef = useRef(false);
  const commitValue = useCallback(
    (nextValue: string, direction: ICommitDirection) => {
      if (committedRef.current) return;
      committedRef.current = true;
      onCommit(nextValue, direction);
    },
    [onCommit],
  );
  const syncHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = `${measureEditorHeight(textarea.value, height)}px`;
  }, [height]);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    draftRef.current = value;
    committedRef.current = false;
    textarea.focus();
    textarea.select();
    syncHeight();
  }, [syncHeight, value]);
  const handleInput = () => {
    draftRef.current = textareaRef.current?.value ?? "";
    syncHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.altKey) {
      e.preventDefault();
      const nextValue = textareaRef.current?.value ?? "";
      draftRef.current = nextValue;
      commitValue(nextValue, "down");
    } else if (e.key === "Enter" && e.altKey) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const { selectionStart, selectionEnd, value: currentValue } = textarea;
      const next =
        currentValue.slice(0, selectionStart) +
        "\n" +
        currentValue.slice(selectionEnd);
      textarea.value = next;
      draftRef.current = next;
      const cursor = selectionStart + 1;
      textarea.setSelectionRange(cursor, cursor);
      syncHeight();
    } else if (e.key === "Escape") {
      e.preventDefault();
      committedRef.current = true;
      onCancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const nextValue = textareaRef.current?.value ?? "";
      draftRef.current = nextValue;
      commitValue(nextValue, "right");
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (document.activeElement === textareaRef.current) return;
      commitValue(draftRef.current, "stay");
    });
  };

  return (
    <textarea
      ref={textareaRef}
      className={styles.cellEditor}
      style={{ top, left, width }}
      defaultValue={value}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}

