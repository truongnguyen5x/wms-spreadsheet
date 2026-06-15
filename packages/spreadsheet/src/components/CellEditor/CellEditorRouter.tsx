import type { ReactNode } from "react";
import type {
  ICellEditorParams,
  ICellMeta,
  ICustomCellDefinition,
  ICommitDirection,
  ISpreadsheetColumn,
} from "../../types";
import styles from "../../styles/spreadsheet.module.scss";
import { CellEditor } from "./CellEditor";
import { SelectCellEditor } from "./SelectCellEditor";
import { DateCellEditor } from "./DateCellEditor";

function CustomEditorContainer({
  top,
  left,
  width,
  height,
  children,
}: {
  top: number;
  left: number;
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.customEditorContainer}
      style={{ top, left, width, height }}
    >
      {children}
    </div>
  );
}

function renderCustomEditor(
  editorParams: ICellEditorParams,
  column: ISpreadsheetColumn | undefined,
  customCellRegistry: Record<string, ICustomCellDefinition> | undefined,
  top: number,
  left: number,
  width: number,
  height: number,
): ReactNode | null {
  const wrap = (content: ReactNode) => (
    <CustomEditorContainer top={top} left={left} width={width} height={height}>
      {content}
    </CustomEditorContainer>
  );

  if (column?.cellEditor) {
    return wrap(column.cellEditor(editorParams));
  }

  const customKey = editorParams.meta.customKey;
  const customEditor = customKey && customCellRegistry?.[customKey]?.editor;
  if (customEditor) {
    return wrap(customEditor(editorParams));
  }

  return null;
}

export interface ICellEditorRouterProps {
  row: number;
  col: number;
  value: string;
  meta: ICellMeta;
  column?: ISpreadsheetColumn;
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  top: number;
  left: number;
  width: number;
  height: number;
  initialInput?: string;
  onCommit: (value: string, direction: ICommitDirection) => void;
  onCancel: () => void;
}

export function CellEditorRouter({
  row,
  col,
  value,
  meta,
  column,
  customCellRegistry,
  top,
  left,
  width,
  height,
  initialInput,
  onCommit,
  onCancel,
}: ICellEditorRouterProps) {
  const type = meta.type ?? "text";
  if (type === "custom") {
    const editorParams: ICellEditorParams = {
      row,
      col,
      value,
      meta,
      isActive: true,
      top,
      left,
      width,
      height,
      onCommit: (nextValue: string, direction?: ICommitDirection) =>
        onCommit(nextValue, direction ?? "stay"),
      onCancel,
    };

    const customEditor = renderCustomEditor(
      editorParams,
      column,
      customCellRegistry,
      top,
      left,
      width,
      height,
    );
    if (customEditor) {
      return <>{customEditor}</>;
    }
  }

  if (type === "select") {
    return (
      <SelectCellEditor
        value={value}
        options={meta.options ?? []}
        top={top}
        left={left}
        width={width}
        height={height}
        initialInput={initialInput}
        onCommit={(nextValue) => onCommit(nextValue, "stay")}
        onCancel={onCancel}
      />
    );
  }

  if (type === "date") {
    return (
      <DateCellEditor
        value={value}
        dateFormat={meta.dateFormat}
        minDate={meta.minDate}
        maxDate={meta.maxDate}
        top={top}
        left={left}
        width={width}
        height={height}
        onCommit={(nextValue) => onCommit(nextValue, "stay")}
        onCancel={onCancel}
      />
    );
  }

  return (
    <CellEditor
      row={row}
      col={col}
      value={value}
      top={top}
      left={left}
      width={width}
      height={height}
      onCommit={onCommit}
      onCancel={onCancel}
    />
  );
}

