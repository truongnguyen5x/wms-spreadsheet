import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  createDefaultColumnFilterState,
  isConditionWithInput,
} from "../../utils/columnFilter";
import { computePopupPosition, type IPopupPosition } from "../../utils/popupPosition";
import { FILTER_BLANK_VALUE, type IColumnFilterState, type TSortDirection } from "../../types";
import styles from "./ColumnFilterPopup.module.scss";

const POPUP_MIN_WIDTH = 284;
const POPUP_FALLBACK_HEIGHT = 420;

export interface IFilterValueOption {
  value: string;
  label: string;
}

export interface IColumnFilterPopupProps {
  anchorRect: DOMRect;
  filterState: IColumnFilterState;
  activeSortDirection?: TSortDirection;
  valueOptions: IFilterValueOption[];
  sortFilterDisabled?: boolean;
  onSort: (direction: TSortDirection) => void;
  onApply: (nextState: IColumnFilterState) => void;
  onReset: () => void;
  onCancel: () => void;
}

const CONDITION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "isEmpty", label: "Is empty" },
  { value: "isNotEmpty", label: "Is not empty" },
  { value: "isEqualTo", label: "Is equal to" },
  { value: "isNotEqualTo", label: "Is not equal to" },
  { value: "beginsWith", label: "Begins with" },
  { value: "endsWith", label: "Ends with" },
  { value: "contains", label: "Contains" },
  { value: "doesNotContain", label: "Does not contain" },
] as const;

function resolveAllValues(options: readonly IFilterValueOption[]): string[] {
  return options.map((option) => option.value);
}

function normalizeToSelectedSet(
  selectedValues: string[] | null,
  options: readonly IFilterValueOption[],
): Set<string> {
  if (selectedValues === null) {
    return new Set(resolveAllValues(options));
  }
  return new Set(selectedValues);
}

export function ColumnFilterPopup({
  anchorRect,
  filterState,
  activeSortDirection,
  valueOptions,
  sortFilterDisabled = false,
  onSort,
  onApply,
  onReset,
  onCancel,
}: IColumnFilterPopupProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftFilter, setDraftFilter] = useState<IColumnFilterState>(filterState);
  const [position, setPosition] = useState<IPopupPosition | null>(null);

  useEffect(() => {
    setDraftFilter(filterState);
    setSearchQuery("");
  }, [filterState]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return valueOptions;
    return valueOptions.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery, valueOptions]);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const popupHeight = rootRef.current?.offsetHeight ?? POPUP_FALLBACK_HEIGHT;
      setPosition(computePopupPosition(anchorRect, popupHeight, POPUP_MIN_WIDTH));
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRect]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      onCancel();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const selectedSet = useMemo(
    () => normalizeToSelectedSet(draftFilter.selectedValues, valueOptions),
    [draftFilter.selectedValues, valueOptions],
  );

  const handleConditionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCondition = event.target.value as IColumnFilterState["condition"];
    setDraftFilter((prev) => ({
      ...prev,
      condition: nextCondition,
      conditionValue: isConditionWithInput(nextCondition)
        ? prev.conditionValue ?? ""
        : undefined,
    }));
  };

  const handleToggleValue = (value: string) => {
    const nextSet = normalizeToSelectedSet(draftFilter.selectedValues, valueOptions);
    if (nextSet.has(value)) {
      nextSet.delete(value);
    } else {
      nextSet.add(value);
    }
    const allValues = resolveAllValues(valueOptions);
    const nextValues =
      nextSet.size === allValues.length ? null : allValues.filter((item) => nextSet.has(item));
    setDraftFilter((prev) => ({ ...prev, selectedValues: nextValues }));
  };

  const handleSelectAll = () => {
    setDraftFilter((prev) => ({ ...prev, selectedValues: null }));
  };

  const handleClearValues = () => {
    setDraftFilter((prev) => ({ ...prev, selectedValues: [] }));
  };

  const handleApply = () => {
    const normalized = {
      ...draftFilter,
      conditionValue: isConditionWithInput(draftFilter.condition)
        ? draftFilter.conditionValue ?? ""
        : undefined,
    };
    onApply(normalized);
  };

  const popupContent = (
    <div
      ref={rootRef}
      className={styles.popup}
      style={
        position
          ? {
              top: position.top,
              left: position.left,
              width: position.width,
              visibility: "visible",
            }
          : { visibility: "hidden" }
      }
      role="dialog"
      aria-label="Column filter"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={styles.actionButton}
        aria-pressed={activeSortDirection === "asc"}
        disabled={sortFilterDisabled}
        onClick={() => onSort("asc")}
      >
        <span className={styles.actionButtonContent}>
          <span className={styles.sortIndicator} aria-hidden>
            {activeSortDirection === "asc" ? "✓" : ""}
          </span>
          Sắp xếp A-Z
        </span>
      </button>
      <button
        type="button"
        className={styles.actionButton}
        aria-pressed={activeSortDirection === "desc"}
        disabled={sortFilterDisabled}
        onClick={() => onSort("desc")}
      >
        <span className={styles.actionButtonContent}>
          <span className={styles.sortIndicator} aria-hidden>
            {activeSortDirection === "desc" ? "✓" : ""}
          </span>
          Sắp xếp Z-A
        </span>
      </button>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p className={styles.label}>Filter by condition:</p>
        <select
          className={styles.select}
          value={draftFilter.condition}
          disabled={sortFilterDisabled}
          onChange={handleConditionChange}
        >
          {CONDITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isConditionWithInput(draftFilter.condition) && (
          <input
            type="text"
            className={styles.input}
            value={draftFilter.conditionValue ?? ""}
            onChange={(event) =>
              setDraftFilter((prev) => ({
                ...prev,
                conditionValue: event.target.value,
              }))
            }
            placeholder="Value"
          />
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.label}>Filter by value:</p>
        <input
          type="text"
          className={styles.input}
          placeholder="Search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <div className={styles.inlineActions}>
          <button type="button" className={styles.linkButton} onClick={handleSelectAll}>
            Select all
          </button>
          <button type="button" className={styles.linkButton} onClick={handleClearValues}>
            Clear
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {filteredOptions.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="checkbox"
              checked={selectedSet.has(option.value)}
              onChange={() => handleToggleValue(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.secondaryButton} onClick={onReset}>
          Đặt lại
        </button>
        <div className={styles.footerRight}>
          <button type="button" className={styles.primaryButton} onClick={handleApply}>
            OK
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(popupContent, document.body);
}

export function createFilterValueOptions(values: readonly string[]): IFilterValueOption[] {
  const options: IFilterValueOption[] = [];
  let hasBlank = false;
  for (const value of values) {
    if (value === FILTER_BLANK_VALUE) {
      hasBlank = true;
      continue;
    }
    options.push({ value, label: value });
  }
  if (hasBlank) {
    options.unshift({ value: FILTER_BLANK_VALUE, label: "(Blank cells)" });
  }
  return options;
}

export const DEFAULT_COLUMN_FILTER_STATE = createDefaultColumnFilterState();
