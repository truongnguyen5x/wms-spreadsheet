import type { ReactNode } from "react";
import type {
  ICellRenderParams,
  ICustomCellDefinition,
  ISelectOption,
  ISpreadsheetColumn,
} from "../types";
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
  if (!option && !value) return null;
  return (
    <span
      className={styles.selectPill}
      style={option?.color ? { backgroundColor: option.color } : undefined}
    >
      <span className={styles.selectPillLabel}>{option?.label ?? value}</span>
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
  onToggle,
}: IBooleanRenderParams): ReactNode {
  const checked = value === "true";
  return (
    <label
      className={styles.booleanCell}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className={styles.booleanCheckbox}
        checked={checked}
        onChange={() => onToggle(row, col, checked ? "false" : "true")}
      />
    </label>
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

