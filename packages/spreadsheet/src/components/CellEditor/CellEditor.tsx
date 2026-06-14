import { useEffect, useRef } from "react";
import styles from "../../styles/spreadsheet.module.scss";

export type ICommitDirection = "stay" | "down" | "right";

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

export function CellEditor({
  value,
  top,
  left,
  width,
  height,
  onCommit,
  onCancel,
}: ICellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCommit(inputRef.current?.value ?? "", "down");
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onCommit(inputRef.current?.value ?? "", "right");
    }
  };

  const handleBlur = () => {
    onCommit(inputRef.current?.value ?? "", "stay");
  };

  return (
    <input
      ref={inputRef}
      className={styles.cellEditor}
      style={{ top, left, width, height }}
      defaultValue={value}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
