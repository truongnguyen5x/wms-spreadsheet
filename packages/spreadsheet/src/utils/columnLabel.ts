export function columnLabel(col: number): string {
  let label = "";
  let n = col + 1;
  while (n > 0) {
    n -= 1;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return label;
}

