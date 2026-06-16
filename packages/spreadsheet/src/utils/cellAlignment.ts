import type { CSSProperties } from "react";
import type { ISpreadsheetColumn } from "../types";

const HORIZONTAL_JUSTIFY: Record<
  NonNullable<ISpreadsheetColumn["horizontalAlign"]>,
  CSSProperties["justifyContent"]
> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const VERTICAL_ALIGN: Record<
  NonNullable<ISpreadsheetColumn["verticalAlign"]>,
  CSSProperties["alignItems"]
> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
};

export function getCellAlignmentStyle(
  column?: ISpreadsheetColumn,
): CSSProperties {
  const horizontal = column?.horizontalAlign ?? "left";
  const vertical = column?.verticalAlign ?? "top";

  return {
    justifyContent: HORIZONTAL_JUSTIFY[horizontal],
    alignItems: VERTICAL_ALIGN[vertical],
    textAlign: horizontal,
  };
}
