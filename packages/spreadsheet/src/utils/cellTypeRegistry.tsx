import type { ReactNode } from "react";
import type {
  ICellRenderParams,
  ICustomCellDefinition,
  ISelectOption,
  ISpreadsheetColumn,
} from "../types";
import { SwitchCell } from "../components/SwitchCell";
import {
  DEFAULT_DATE_FORMAT,
  formatDateValue,
} from "./dateUtils";
import styles from "../styles/spreadsheet.module.scss";

function findSelectOption(
  options: ISelectOption[] | undefined,
  value: string,
): ISelectOption | undefined {
  if (!options?.length || !value) return undefined;
  return options.find((option) => option.id === value);
}

function renderText({ value }: ICellRenderParams): ReactNode {
  return value;
}

function renderSelect({ value, meta }: ICellRenderParams): ReactNode {
  const option = findSelectOption(meta.options, value);
  const label = option?.label ?? (value || "");

  return (
    <span
      className={styles.selectPill}
      style={option?.color ? { backgroundColor: option.color } : undefined}
    >
      <span className={styles.selectPillLabel}>{label}</span>
      <span className={styles.selectCaret} aria-hidden>
        ▾
      </span>
    </span>
  );
}

interface IBooleanRenderParams extends ICellRenderParams {
  onToggle: (row: number, col: number, nextValue: string) => void;
}

function renderBoolean({
  row,
  col,
  value,
  meta,
  onToggle,
}: IBooleanRenderParams): ReactNode {
  const checked = value === "true";
  return (
    <div className={styles.booleanCell}>
      <input
        type="checkbox"
        className={styles.booleanCheckbox}
        checked={checked}
        disabled={meta.disabled}
        onChange={() => onToggle(row, col, checked ? "false" : "true")}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function renderSwitch({
  row,
  col,
  value,
  meta,
  onToggle,
}: IBooleanRenderParams): ReactNode {
  const checked = value === "true";
  return (
    <div className={styles.switchCell}>
      <SwitchCell
        checked={checked}
        disabled={meta.disabled}
        onChange={(next) => onToggle(row, col, next ? "true" : "false")}
      />
    </div>
  );
}

function renderDate({ value, meta }: ICellRenderParams): ReactNode {
  const format = meta.dateFormat ?? DEFAULT_DATE_FORMAT;
  const display = value ? formatDateValue(value, format) : "";

  return (
    <span className={styles.datePill}>
      <span className={styles.datePillLabel}>{display}</span>
      <span className={styles.dateCaret} aria-hidden>
        ▾
      </span>
    </span>
  );
}

function renderCustom(
  params: ICellRenderParams,
  column: ISpreadsheetColumn | undefined,
  customCellRegistry?: Record<string, ICustomCellDefinition>,
): ReactNode {
  if (column?.cellRender) {
    return column.cellRender(params);
  }

  const customKey = params.meta.customKey;
  if (customKey && customCellRegistry?.[customKey]) {
    return customCellRegistry[customKey].render(params);
  }

  return params.value;
}

export interface IRenderCellContentParams {
  params: ICellRenderParams;
  column?: ISpreadsheetColumn;
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
}

export function renderCellContent({
  params,
  column,
  customCellRegistry,
  onBooleanToggle,
}: IRenderCellContentParams): ReactNode {
  const type = params.meta.type ?? "text";
  switch (type) {
    case "select":
      return renderSelect(params);
    case "boolean":
      return renderBoolean({ ...params, onToggle: onBooleanToggle });
    case "switch":
      return renderSwitch({ ...params, onToggle: onBooleanToggle });
    case "date":
      return renderDate(params);
    case "custom":
      return renderCustom(params, column, customCellRegistry);
    default:
      return renderText(params);
  }
}

export function findSelectOptionById(
  options: ISelectOption[] | undefined,
  value: string,
): ISelectOption | undefined {
  return findSelectOption(options, value);
}

