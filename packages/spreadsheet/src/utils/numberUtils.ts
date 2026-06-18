const DEFAULT_DECIMAL_PLACES = 0;

function resolveDecimalPlaces(decimalPlaces?: number): number {
  if (decimalPlaces === undefined || decimalPlaces < 0) {
    return DEFAULT_DECIMAL_PLACES;
  }
  return Math.floor(decimalPlaces);
}

export function sanitizeNumberDraft(
  raw: string,
  decimalPlaces?: number,
): string {
  const places = resolveDecimalPlaces(decimalPlaces);
  let result = "";
  let hasDecimal = false;
  let fractionDigits = 0;

  for (const char of raw) {
    if (char >= "0" && char <= "9") {
      if (hasDecimal) {
        if (fractionDigits >= places) continue;
        fractionDigits += 1;
      }
      result += char;
      continue;
    }

    if (char === "." && places > 0 && !hasDecimal) {
      hasDecimal = true;
      result += char;
    }
  }

  return result;
}

export function parseNumberValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function isValidNonNegativeNumber(
  value: number,
  maxValue?: number,
  decimalPlaces?: number,
): boolean {
  if (value < 0) return false;
  if (maxValue !== undefined && value > maxValue) return false;

  const places = resolveDecimalPlaces(decimalPlaces);
  const [, fraction = ""] = value.toString().split(".");
  if (fraction.length > places) return false;

  return true;
}

export function formatNumberValue(
  value: number,
  decimalPlaces?: number,
): string {
  const places = resolveDecimalPlaces(decimalPlaces);
  return value.toFixed(places);
}

export function formatNumberDisplay(
  raw: string,
  decimalPlaces?: number,
): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const parsed = parseNumberValue(trimmed);
  if (parsed === null || parsed < 0) return trimmed;
  return formatNumberValue(parsed, decimalPlaces);
}

export function normalizeNumberValue(
  raw: string,
  maxValue?: number,
  decimalPlaces?: number,
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const parsed = parseNumberValue(trimmed);
  if (parsed === null || parsed < 0) return null;

  const places = resolveDecimalPlaces(decimalPlaces);
  let normalized = Number(parsed.toFixed(places));

  if (maxValue !== undefined && normalized > maxValue) {
    normalized = Number(maxValue.toFixed(places));
  }

  if (normalized < 0) return null;

  return formatNumberValue(normalized, decimalPlaces);
}
