import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ROW_HEIGHT, type ISelectOption } from "../../types";
import { findSelectOptionById } from "../../utils/cellTypeRegistry";
import styles from "./SelectCellEditor.module.scss";

export interface ISelectCellEditorProps {
  value: string;
  options: ISelectOption[];
  top: number;
  left: number;
  width: number;
  height: number;
  initialInput?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

interface ISelectListItem {
  id: string;
  label: string;
  color?: string;
  isEmpty?: boolean;
}

const EMPTY_OPTION: ISelectListItem = {
  id: "",
  label: "—",
  isEmpty: true,
};

function buildBrowseList(options: ISelectOption[]): ISelectListItem[] {
  return [EMPTY_OPTION, ...options];
}

function getBrowseSelectedIndex(
  options: ISelectOption[],
  value: string,
): number {
  const items = buildBrowseList(options);
  const idx = items.findIndex((item) => item.id === value);
  return Math.max(idx, 0);
}

function filterSelectOptions(
  options: ISelectOption[],
  query: string,
): ISelectListItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(normalizedQuery) ||
          option.id.toLowerCase().includes(normalizedQuery),
      )
    : options;

  return [EMPTY_OPTION, ...filtered];
}

export function SelectCellEditor({
  value,
  options,
  top,
  left,
  width,
  height: _height,
  initialInput,
  onCommit,
  onCancel,
}: ISelectCellEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  const selectedOption = findSelectOptionById(options, value);
  const [query, setQuery] = useState(
    () => initialInput ?? selectedOption?.label ?? "",
  );
  const [isFiltering, setIsFiltering] = useState(
    () => initialInput !== undefined,
  );
  const [isOpen, setIsOpen] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(() =>
    initialInput !== undefined
      ? 0
      : getBrowseSelectedIndex(options, value),
  );

  const listItems = useMemo(() => {
    if (!isFiltering) return buildBrowseList(options);
    return filterSelectOptions(options, query);
  }, [isFiltering, options, query]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (initialInput !== undefined) {
      input.setSelectionRange(input.value.length, input.value.length);
    } else if (selectedOption?.label) {
      input.select();
    }
  }, [initialInput, selectedOption?.label]);

  useEffect(() => {
    if (isFiltering) {
      setHighlightIndex(0);
    }
  }, [isFiltering, listItems]);

  const commitItem = useCallback(
    (item: ISelectListItem) => {
      if (committedRef.current) return;
      committedRef.current = true;
      onCommit(item.id);
    },
    [onCommit],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
    if (!isFiltering) {
      setIsFiltering(true);
      setHighlightIndex(0);
    }
    setIsOpen(true);
  };

  const handleOptionMouseDown = (
    e: React.MouseEvent,
    item: ISelectListItem,
  ) => {
    e.preventDefault();
    commitItem(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) =>
        Math.min(prev + 1, listItems.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = listItems[highlightIndex];
      if (item) commitItem(item);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const item = listItems[highlightIndex];
      if (item) commitItem(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      committedRef.current = true;
      onCancel();
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (committedRef.current) return;
      const root = rootRef.current;
      if (root?.contains(document.activeElement)) return;
      onCancel();
    });
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ top, left, width, height: DEFAULT_ROW_HEIGHT }}
    >
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="select-cell-editor-listbox"
      />
      {isOpen && listItems.length > 0 && (
        <ul
          id="select-cell-editor-listbox"
          className={styles.dropdown}
          role="listbox"
        >
          {listItems.map((item, index) => (
            <li
              key={item.id || "__empty__"}
              role="option"
              aria-selected={
                isFiltering ? index === highlightIndex : item.id === value
              }
              className={[
                styles.option,
                !isFiltering && item.id === value
                  ? styles.optionSelected
                  : "",
                index === highlightIndex ? styles.optionHighlighted : "",
                item.isEmpty ? styles.optionEmpty : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={(e) => handleOptionMouseDown(e, item)}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              {item.color && (
                <span
                  className={styles.optionColor}
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className={styles.optionLabel}>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
