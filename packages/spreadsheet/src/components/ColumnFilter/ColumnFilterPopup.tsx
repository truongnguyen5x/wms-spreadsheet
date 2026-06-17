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
import { FILTER_BLANK_VALUE, type IColumnFilterState, type TFilterCondition, type TSortDirection } from "../../types";
import { useSpreadsheetLocale } from "../../context/SpreadsheetLocaleContext";
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

const FILTER_CONDITIONS: TFilterCondition[] = [
  "none",
  "isEmpty",
  "isNotEmpty",
  "isEqualTo",
  "isNotEqualTo",
  "beginsWith",
  "endsWith",
  "contains",
  "doesNotContain",
];

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
  const locale = useSpreadsheetLocale();
  const { filter: filterLocale } = locale;
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
      aria-label={filterLocale.dialogAriaLabel}
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
          {filterLocale.sortAsc}
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
          {filterLocale.sortDesc}
        </span>
      </button>

      <div className={styles.divider} />

      <div className={styles.section}>
        <p className={styles.label}>{filterLocale.filterByCondition}</p>
        <select
          className={styles.select}
          value={draftFilter.condition}
          disabled={sortFilterDisabled}
          onChange={handleConditionChange}
        >
          {FILTER_CONDITIONS.map((condition) => (
            <option key={condition} value={condition}>
              {filterLocale.conditions[condition]}
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
            placeholder={filterLocale.valuePlaceholder}
          />
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.label}>{filterLocale.filterByValue}</p>
        <input
          type="text"
          className={styles.input}
          placeholder={filterLocale.searchPlaceholder}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <div className={styles.inlineActions}>
          <button type="button" className={styles.linkButton} onClick={handleSelectAll}>
            {filterLocale.selectAll}
          </button>
          <button type="button" className={styles.linkButton} onClick={handleClearValues}>
            {filterLocale.clear}
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
          {filterLocale.reset}
        </button>
        <div className={styles.footerRight}>
          <button type="button" className={styles.primaryButton} onClick={handleApply}>
            {filterLocale.ok}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            {filterLocale.cancel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(popupContent, document.body);
}

export function createFilterValueOptions(
  values: readonly string[],
  blankLabel: string,
): IFilterValueOption[] {
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
    options.unshift({ value: FILTER_BLANK_VALUE, label: blankLabel });
  }
  return options;
}

export const DEFAULT_COLUMN_FILTER_STATE = createDefaultColumnFilterState();
