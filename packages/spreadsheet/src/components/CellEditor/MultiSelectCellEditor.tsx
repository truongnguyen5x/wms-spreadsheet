import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ROW_HEIGHT, type ISelectOption } from "../../types";
import {
  DEFAULT_MULTI_SELECT_CHIP_COLOR,
  parseMultiSelectValue,
  resolveMultiSelectOptions,
  serializeMultiSelectValue,
} from "../../utils/multiSelectUtils";
import styles from "./MultiSelectCellEditor.module.scss";

export interface IMultiSelectCellEditorProps {
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

function filterOptions(
  options: ISelectOption[],
  query: string,
): ISelectOption[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.id.toLowerCase().includes(normalizedQuery),
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

export function MultiSelectCellEditor({
  value,
  options,
  top,
  left,
  width,
  height: _height,
  initialInput,
  onCommit,
  onCancel,
}: IMultiSelectCellEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  const initialIds = useMemo(() => parseMultiSelectValue(value), [value]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialIds),
  );
  const [searchQuery, setSearchQuery] = useState(() => initialInput ?? "");
  const [isOpen, setIsOpen] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const selectedItems = useMemo(
    () => resolveMultiSelectOptions(options, Array.from(selectedIds)),
    [options, selectedIds],
  );

  const listItems = useMemo(
    () => filterOptions(options, searchQuery),
    [options, searchQuery],
  );

  const commitSelection = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(serializeMultiSelectValue(Array.from(selectedIds)));
  }, [onCommit, selectedIds]);

  useEffect(() => {
    const input = searchInputRef.current;
    if (!input) return;
    input.focus();
    if (initialInput !== undefined) {
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [initialInput]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchQuery, listItems]);

  const toggleOption = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setIsOpen(true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleOptionMouseDown = (
    e: React.MouseEvent,
    option: ISelectOption,
  ) => {
    e.preventDefault();
    toggleOption(option.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) =>
        Math.min(prev + 1, Math.max(listItems.length - 1, 0)),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commitSelection();
    } else if (e.key === " ") {
      e.preventDefault();
      const option = listItems[highlightIndex];
      if (option) toggleOption(option.id);
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitSelection();
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
      commitSelection();
    });
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ top, left, width, height: DEFAULT_ROW_HEIGHT }}
    >
      <div
        className={styles.trigger}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className={styles.chips}>
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className={styles.chip}
              style={{
                backgroundColor: item.color ?? DEFAULT_MULTI_SELECT_CHIP_COLOR,
              }}
            >
              <span className={styles.chipLabel}>{item.label}</span>
            </span>
          ))}
        </span>
      </div>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchRow}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={() => setIsOpen(true)}
              autoComplete="off"
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="multi-select-cell-editor-listbox"
              placeholder=""
            />
          </div>
          <div className={styles.searchDivider} />
          <ul
            id="multi-select-cell-editor-listbox"
            className={styles.optionsList}
            role="listbox"
            aria-multiselectable
          >
            {listItems.map((option, index) => {
              const isSelected = selectedIds.has(option.id);
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    styles.optionRow,
                    index === highlightIndex ? styles.optionRowHighlighted : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseDown={(e) => handleOptionMouseDown(e, option)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <span
                    className={styles.optionPill}
                    style={{
                      backgroundColor:
                        option.color ?? DEFAULT_MULTI_SELECT_CHIP_COLOR,
                    }}
                  >
                    {option.label}
                  </span>
                  <span className={styles.optionCheck} aria-hidden>
                    {isSelected ? "✓" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
