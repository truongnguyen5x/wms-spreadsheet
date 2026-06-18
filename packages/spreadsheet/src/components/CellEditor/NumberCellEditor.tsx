import { useCallback, useEffect, useRef } from "react";
import type { ICommitDirection } from "../../types";
import {
  normalizeNumberValue,
  sanitizeNumberDraft,
} from "../../utils/numberUtils";
import styles from "../../styles/spreadsheet.module.scss";

export interface INumberCellEditorProps {
  value: string;
  maxValue?: number;
  decimalPlaces?: number;
  top: number;
  left: number;
  width: number;
  height: number;
  initialInput?: string;
  onCommit: (value: string, direction?: ICommitDirection) => void;
  onCancel: () => void;
}

export function NumberCellEditor({
  value,
  maxValue,
  decimalPlaces,
  top,
  left,
  width,
  height,
  initialInput,
  onCommit,
  onCancel,
}: INumberCellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  const tryCommit = useCallback(
    (direction: ICommitDirection) => {
      const normalized = normalizeNumberValue(
        draftRef.current,
        maxValue,
        decimalPlaces,
      );
      if (normalized === null) {
        committedRef.current = true;
        onCancel();
        return;
      }
      commitValue(normalized, direction);
    },
    [commitValue, decimalPlaces, maxValue, onCancel],
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const initialDraft = initialInput ?? value;
    draftRef.current = sanitizeNumberDraft(initialDraft, decimalPlaces);
    committedRef.current = false;
    input.value = draftRef.current;
    input.focus();
    input.select();
  }, [decimalPlaces, initialInput, value]);

  const handleChange = () => {
    const input = inputRef.current;
    if (!input) return;
    const sanitized = sanitizeNumberDraft(input.value, decimalPlaces);
    input.value = sanitized;
    draftRef.current = sanitized;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryCommit("down");
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      committedRef.current = true;
      onCancel();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      tryCommit("right");
      return;
    }

    if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (document.activeElement === inputRef.current) return;
      tryCommit("stay");
    });
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className={`${styles.cellEditor} ${styles.numberCellEditor}`}
      style={{ top, left, width, height }}
      defaultValue={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
