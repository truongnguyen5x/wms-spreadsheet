import {
  DEFAULT_DATE_FORMAT,
  formatDate,
  getFormatTokenOrder,
  getSeparator,
  parseDateString,
} from "./dateUtils";

export type TDateSectionType = "DD" | "MM" | "YYYY";

export interface IDateFieldSection {
  type: TDateSectionType;
  query: string;
}

export interface IDateFieldState {
  sections: IDateFieldSection[];
  separator: string;
  activeSectionIndex: number;
}

export interface IApplyDigitResult {
  state: IDateFieldState;
  shouldAdvance: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getSectionMax(type: TDateSectionType): number {
  if (type === "DD") return 31;
  if (type === "MM") return 12;
  return 9999;
}

function getSectionMaxDigits(type: TDateSectionType): number {
  return type === "YYYY" ? 4 : 2;
}

function getAutoAdvanceThreshold(type: TDateSectionType): number {
  if (type === "DD") return 3;
  if (type === "MM") return 1;
  return -1;
}

function getSectionPlaceholder(type: TDateSectionType): string {
  return type === "YYYY" ? "____" : "__";
}

function isSectionComplete(section: IDateFieldSection): boolean {
  if (!section.query) return false;
  const maxDigits = getSectionMaxDigits(section.type);
  if (section.type === "YYYY") {
    return section.query.length >= maxDigits;
  }
  const threshold = getAutoAdvanceThreshold(section.type);
  const num = Number.parseInt(section.query, 10);
  return (
    section.query.length >= maxDigits ||
    (section.query.length === 1 && num > threshold)
  );
}

function parseSectionQuery(section: IDateFieldSection): number | null {
  if (!section.query) return null;
  const num = Number.parseInt(section.query, 10);
  return Number.isNaN(num) ? null : num;
}

function getSectionNumericValue(section: IDateFieldSection): number | null {
  if (!isSectionComplete(section)) return null;
  return parseSectionQuery(section);
}

function applyDigitToSection(
  section: IDateFieldSection,
  digit: string,
): { section: IDateFieldSection; shouldAdvance: boolean } {
  const max = getSectionMax(section.type);
  const maxDigits = getSectionMaxDigits(section.type);
  const threshold = getAutoAdvanceThreshold(section.type);
  const d = Number.parseInt(digit, 10);

  if (section.type === "YYYY") {
    const newQuery = section.query + digit;
    if (newQuery.length >= maxDigits) {
      return {
        section: { ...section, query: newQuery.slice(0, maxDigits) },
        shouldAdvance: true,
      };
    }
    return { section: { ...section, query: newQuery }, shouldAdvance: false };
  }

  if (section.query === "") {
    if (d > threshold) {
      return { section: { ...section, query: digit }, shouldAdvance: true };
    }
    return { section: { ...section, query: digit }, shouldAdvance: false };
  }

  const newQuery = section.query + digit;
  const num = Number.parseInt(newQuery, 10);

  if (num > max) {
    if (d > threshold) {
      return { section: { ...section, query: digit }, shouldAdvance: true };
    }
    return { section: { ...section, query: digit }, shouldAdvance: false };
  }

  if (newQuery.length >= maxDigits) {
    return { section: { ...section, query: newQuery }, shouldAdvance: true };
  }

  return { section: { ...section, query: newQuery }, shouldAdvance: false };
}

function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(day, lastDay);
}

export function createDateFieldState(
  value: string,
  format: string = DEFAULT_DATE_FORMAT,
): IDateFieldState {
  const tokens = getFormatTokenOrder(format);
  const separator = getSeparator(format);
  const parsed = value.trim() ? parseDateString(value, format) : null;

  const sections: IDateFieldSection[] = tokens.map((type) => {
    if (!parsed) {
      return { type, query: "" };
    }
    if (type === "DD") {
      return { type, query: String(parsed.getDate()) };
    }
    if (type === "MM") {
      return { type, query: String(parsed.getMonth() + 1) };
    }
    return { type, query: String(parsed.getFullYear()) };
  });

  return { sections, separator, activeSectionIndex: 0 };
}

export function createDateFieldStateFromDate(
  date: Date,
  format: string = DEFAULT_DATE_FORMAT,
): IDateFieldState {
  return createDateFieldState(formatDate(date, format), format);
}

export function applyDigit(
  state: IDateFieldState,
  digit: string,
): IApplyDigitResult {
  const activeIndex = state.activeSectionIndex;
  const activeSection = state.sections[activeIndex];
  if (!activeSection) {
    return { state, shouldAdvance: false };
  }

  const { section: updatedSection, shouldAdvance } = applyDigitToSection(
    activeSection,
    digit,
  );

  const sections = state.sections.map((s, i) =>
    i === activeIndex ? updatedSection : s,
  );

  let activeSectionIndex = activeIndex;
  if (shouldAdvance && activeIndex < sections.length - 1) {
    activeSectionIndex = activeIndex + 1;
  }

  return {
    state: { ...state, sections, activeSectionIndex },
    shouldAdvance,
  };
}

export function applyBackspace(state: IDateFieldState): IDateFieldState {
  const activeIndex = state.activeSectionIndex;
  const activeSection = state.sections[activeIndex];
  if (!activeSection) return state;

  if (activeSection.query === "") {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      const sections = state.sections.map((s, i) =>
        i === prevIndex ? { ...s, query: "" } : s,
      );
      return { ...state, sections, activeSectionIndex: prevIndex };
    }
    return state;
  }

  const sections = state.sections.map((s, i) =>
    i === activeIndex ? { ...s, query: "" } : s,
  );
  return { ...state, sections };
}

export function moveSection(
  state: IDateFieldState,
  direction: -1 | 1,
): IDateFieldState {
  const nextIndex = state.activeSectionIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.sections.length) {
    return state;
  }
  return { ...state, activeSectionIndex: nextIndex };
}

export function setActiveSection(
  state: IDateFieldState,
  index: number,
): IDateFieldState {
  if (index < 0 || index >= state.sections.length) {
    return state;
  }
  return { ...state, activeSectionIndex: index };
}

export function incrementSection(
  state: IDateFieldState,
  delta: number,
): IDateFieldState {
  const activeIndex = state.activeSectionIndex;
  const activeSection = state.sections[activeIndex];
  if (!activeSection) return state;

  const max = getSectionMax(activeSection.type);
  const min = activeSection.type === "YYYY" ? 1 : 1;

  let current = parseSectionQuery(activeSection);
  if (current === null) {
    current = activeSection.type === "YYYY" ? new Date().getFullYear() : min;
  }

  let next = current + delta;
  if (activeSection.type === "YYYY") {
    next = Math.max(1, Math.min(max, next));
  } else {
    if (next < min) next = max;
    if (next > max) next = min;
  }

  const sections = state.sections.map((s, i) =>
    i === activeIndex ? { ...s, query: String(next) } : s,
  );

  return { ...state, sections };
}

export function getSectionDisplayText(section: IDateFieldSection): {
  text: string;
  isPlaceholder: boolean;
} {
  if (!section.query) {
    return { text: getSectionPlaceholder(section.type), isPlaceholder: true };
  }

  if (section.type === "YYYY") {
    const maxDigits = getSectionMaxDigits(section.type);
    if (section.query.length < maxDigits) {
      return { text: section.query, isPlaceholder: false };
    }
    return { text: section.query, isPlaceholder: false };
  }

  if (isSectionComplete(section)) {
    return {
      text: pad2(Number.parseInt(section.query, 10)),
      isPlaceholder: false,
    };
  }

  return { text: section.query, isPlaceholder: false };
}

export function isFieldComplete(state: IDateFieldState): boolean {
  return state.sections.every(isSectionComplete);
}

export function resolveDateFromField(state: IDateFieldState): Date | null {
  if (!isFieldComplete(state)) return null;

  let day = 0;
  let month = 0;
  let year = 0;

  for (const section of state.sections) {
    const value = getSectionNumericValue(section);
    if (value === null) return null;
    if (section.type === "DD") day = value;
    if (section.type === "MM") month = value;
    if (section.type === "YYYY") year = value;
  }

  if (!day || !month || !year) return null;

  day = clampDay(year, month, day);

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
