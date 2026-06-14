import { useEffect, useRef } from "react";
import type { ISelectOption } from "../../types";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISelectCellEditorProps {
  value: string;
  options: ISelectOption[];
  top: number;
  left: number;
  width: number;
  height: number;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

export function SelectCellEditor({
  value,
  options,
  top,
  left,
  width,
  height,
  onCommit,
  onCancel,
}: ISelectCellEditorProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;
    select.focus();
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCommit(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (document.activeElement === selectRef.current) return;
      onCancel();
    });
  };

  return (
    <select
      ref={selectRef}
      className={styles.selectEditor}
      style={{ top, left, width, minHeight: height }}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <option value="">—</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

