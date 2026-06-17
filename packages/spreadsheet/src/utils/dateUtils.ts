export const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";

const DEFAULT_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DEFAULT_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface ICalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
}

export interface ICalendarMonth {
  leadingBlanks: number;
  days: ICalendarDay[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDate(date: Date, format: string): string {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = String(date.getFullYear());

  return format
    .replace(/YYYY/g, year)
    .replace(/MM/g, month)
    .replace(/DD/g, day);
}

export function getFormatTokenOrder(format: string): ("DD" | "MM" | "YYYY")[] {
  const tokens: ("DD" | "MM" | "YYYY")[] = [];
  const regex = /(DD|MM|YYYY)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(format)) !== null) {
    tokens.push(match[1] as "DD" | "MM" | "YYYY");
  }
  return tokens;
}

export function getSeparator(format: string): string {
  const match = format.match(/[^DMY]+/);
  return match?.[0] ?? "/";
}

export function parseDateString(
  value: string,
  format: string = DEFAULT_DATE_FORMAT,
): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const tokens = getFormatTokenOrder(format);
  if (tokens.length === 0) return null;

  const separator = getSeparator(format);
  const parts = trimmed.split(separator);
  if (parts.length < tokens.length) return null;

  let day = 0;
  let month = 0;
  let year = 0;

  tokens.forEach((token, index) => {
    const num = Number.parseInt(parts[index] ?? "", 10);
    if (Number.isNaN(num)) return;
    if (token === "DD") day = num;
    if (token === "MM") month = num;
    if (token === "YYYY") year = num;
  });

  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatDateValue(
  value: string,
  format: string = DEFAULT_DATE_FORMAT,
): string {
  const parsed = parseDateString(value, format);
  if (!parsed) return value;
  return formatDate(parsed, format);
}

export function getMonthLabel(
  year: number,
  month: number,
  monthNames: readonly string[] = DEFAULT_MONTH_NAMES,
): string {
  return `${monthNames[month]} ${year}`;
}

export function isDateInRange(
  date: Date,
  minDate: Date | null,
  maxDate: Date | null,
): boolean {
  const day = startOfDay(date).getTime();
  if (minDate !== null && day < startOfDay(minDate).getTime()) return false;
  if (maxDate !== null && day > startOfDay(maxDate).getTime()) return false;
  return true;
}

export function parseDateBounds(
  minDateStr?: string,
  maxDateStr?: string,
  format: string = DEFAULT_DATE_FORMAT,
): { min: Date | null; max: Date | null } {
  const min = minDateStr?.trim()
    ? parseDateString(minDateStr, format)
    : null;
  const max = maxDateStr?.trim()
    ? parseDateString(maxDateStr, format)
    : null;
  return { min, max };
}

export function getCalendarMonth(year: number, month: number): ICalendarMonth {
  const today = startOfDay(new Date());
  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: ICalendarDay[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    days.push({
      date,
      day,
      isToday: isSameDay(date, today),
    });
  }

  return { leadingBlanks, days };
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(year: number, month: number, delta: number): {
  year: number;
  month: number;
} {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}
