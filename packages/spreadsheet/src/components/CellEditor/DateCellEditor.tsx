import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { DEFAULT_ROW_HEIGHT } from "../../types";
import {
  DEFAULT_DATE_FORMAT,
  WEEKDAY_LABELS_VI,
  addDays,
  addMonths,
  formatDate,
  formatDateValue,
  getCalendarMonth,
  getMonthLabel,
  isDateInRange,
  isSameDay,
  parseDateBounds,
  parseDateString,
} from "../../utils/dateUtils";
import styles from "./DateCellEditor.module.scss";

const CALENDAR_MIN_WIDTH = 260;
const CALENDAR_GAP = 2;
const MAX_SKIP_DAYS = 31;

export interface IDateCellEditorProps {
  value: string;
  dateFormat?: string;
  minDate?: string;
  maxDate?: string;
  top: number;
  left: number;
  width: number;
  height: number;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

interface ICalendarPosition {
  top: number;
  left: number;
  width: number;
}

function computeCalendarPosition(
  anchorRect: DOMRect,
  calendarHeight: number,
): ICalendarPosition {
  const calendarWidth = Math.max(CALENDAR_MIN_WIDTH, anchorRect.width);
  let top = anchorRect.bottom + CALENDAR_GAP;

  if (top + calendarHeight > window.innerHeight) {
    top = anchorRect.top - calendarHeight - CALENDAR_GAP;
  }

  let left = anchorRect.left;
  if (left + calendarWidth > window.innerWidth) {
    left = Math.max(0, window.innerWidth - calendarWidth);
  }

  return { top, left, width: calendarWidth };
}

export function DateCellEditor({
  value,
  dateFormat = DEFAULT_DATE_FORMAT,
  minDate,
  maxDate,
  top,
  left,
  width,
  height: _height,
  onCommit,
  onCancel,
}: IDateCellEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const committedRef = useRef(false);

  const parsedValue = useMemo(
    () => parseDateString(value, dateFormat),
    [value, dateFormat],
  );
  const displayValue = value ? formatDateValue(value, dateFormat) : "";

  const dateBounds = useMemo(
    () => parseDateBounds(minDate, maxDate, dateFormat),
    [minDate, maxDate, dateFormat],
  );

  const isDayDisabled = useCallback(
    (date: Date) => !isDateInRange(date, dateBounds.min, dateBounds.max),
    [dateBounds],
  );

  const initialView = useMemo(() => {
    const base = parsedValue ?? new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  }, [parsedValue]);

  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(
    () => parsedValue,
  );
  const [calendarPosition, setCalendarPosition] =
    useState<ICalendarPosition | null>(null);

  const calendarMonth = useMemo(
    () => getCalendarMonth(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const todayDisabled = useMemo(
    () => isDayDisabled(new Date()),
    [isDayDisabled],
  );

  const syncViewToDate = useCallback((date: Date) => {
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, []);

  const moveHighlightedDate = useCallback(
    (deltaDays: number) => {
      if (!highlightedDate) return;

      let next = addDays(highlightedDate, deltaDays);
      const direction = deltaDays >= 0 ? 1 : -1;

      for (let i = 0; i < MAX_SKIP_DAYS; i += 1) {
        if (!isDayDisabled(next)) {
          setHighlightedDate(next);
          if (
            next.getFullYear() !== viewYear ||
            next.getMonth() !== viewMonth
          ) {
            syncViewToDate(next);
          }
          return;
        }
        next = addDays(next, direction);
      }
    },
    [highlightedDate, isDayDisabled, syncViewToDate, viewMonth, viewYear],
  );

  const updateCalendarPosition = useCallback(() => {
    const input = inputRef.current;
    const calendar = calendarRef.current;
    if (!input) return;

    const anchorRect = input.getBoundingClientRect();
    const calendarHeight = calendar?.offsetHeight ?? 320;
    setCalendarPosition(computeCalendarPosition(anchorRect, calendarHeight));
  }, []);

  const commitDate = useCallback(
    (date: Date | null) => {
      if (committedRef.current) return;
      if (date && isDayDisabled(date)) return;
      committedRef.current = true;
      onCommit(date ? formatDate(date, dateFormat) : "");
    },
    [dateFormat, isDayDisabled, onCommit],
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  useLayoutEffect(() => {
    updateCalendarPosition();
  }, [updateCalendarPosition, viewYear, viewMonth]);

  useEffect(() => {
    const handleReposition = () => updateCalendarPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [updateCalendarPosition]);

  const handlePrevMonth = () => {
    const next = addMonths(viewYear, viewMonth, -1);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const handleNextMonth = () => {
    const next = addMonths(viewYear, viewMonth, 1);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const handleDayMouseDown = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    if (isDayDisabled(date)) return;
    commitDate(date);
  };

  const handleToday = () => {
    const today = new Date();
    if (isDayDisabled(today)) return;
    commitDate(today);
  };

  const handleClear = () => {
    commitDate(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      committedRef.current = true;
      onCancel();
      return;
    }

    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (highlightedDate && !isDayDisabled(highlightedDate)) {
        commitDate(highlightedDate);
      } else if (parsedValue && !isDayDisabled(parsedValue)) {
        commitDate(parsedValue);
      } else {
        committedRef.current = true;
        onCancel();
      }
      return;
    }

    if (!highlightedDate && e.key.startsWith("Arrow")) {
      const today = new Date();
      setHighlightedDate(today);
      syncViewToDate(today);
      return;
    }

    if (!highlightedDate) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveHighlightedDate(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveHighlightedDate(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlightedDate(-7);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlightedDate(7);
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (committedRef.current) return;
      const activeElement = document.activeElement;
      if (rootRef.current?.contains(activeElement)) return;
      if (calendarRef.current?.contains(activeElement)) return;
      onCancel();
    });
  };

  const calendarContent = (
    <div
      ref={calendarRef}
      className={`${styles.calendar} ${styles.calendarPortal}`}
      style={
        calendarPosition
          ? {
              top: calendarPosition.top,
              left: calendarPosition.left,
              width: calendarPosition.width,
              visibility: "visible",
            }
          : { visibility: "hidden" }
      }
      role="dialog"
      aria-label="Chọn ngày"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handlePrevMonth}
          aria-label="Tháng trước"
        >
          ‹
        </button>
        <span className={styles.monthLabel}>
          {getMonthLabel(viewYear, viewMonth)}
        </span>
        <button
          type="button"
          className={styles.navButton}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleNextMonth}
          aria-label="Tháng sau"
        >
          ›
        </button>
      </div>
      <div className={styles.weekdays}>
        {WEEKDAY_LABELS_VI.map((label) => (
          <span key={label} className={styles.weekday}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.days}>
        {Array.from({ length: calendarMonth.leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} className={styles.dayEmpty} aria-hidden />
        ))}
        {calendarMonth.days.map((item) => {
          const disabled = isDayDisabled(item.date);
          const isSelected =
            parsedValue !== null && isSameDay(item.date, parsedValue);
          const isHighlighted =
            highlightedDate !== null && isSameDay(item.date, highlightedDate);

          return (
            <button
              key={item.date.toISOString()}
              type="button"
              disabled={disabled}
              className={[
                styles.day,
                disabled ? styles.dayDisabled : "",
                item.isToday ? styles.dayToday : "",
                isSelected ? styles.daySelected : "",
                isHighlighted && !isSelected ? styles.dayHighlighted : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={(e) => handleDayMouseDown(e, item.date)}
              onMouseEnter={() => {
                if (!disabled) {
                  setHighlightedDate(item.date);
                }
              }}
            >
              {item.day}
            </button>
          );
        })}
      </div>
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.footerButton}
          disabled={todayDisabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToday}
        >
          Hôm nay
        </button>
        <button
          type="button"
          className={styles.footerButton}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
        >
          Xóa
        </button>
      </div>
    </div>
  );

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
        value={displayValue}
        readOnly
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-haspopup="dialog"
        aria-expanded
      />
      {createPortal(calendarContent, document.body)}
    </div>
  );
}
