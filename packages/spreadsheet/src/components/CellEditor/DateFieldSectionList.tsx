import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { IDateFieldState } from "../../utils/dateFieldSections";
import {
  applyBackspace,
  applyDigit,
  getSectionDisplayText,
  incrementSection,
  moveSection,
  setActiveSection,
} from "../../utils/dateFieldSections";
import styles from "./DateCellEditor.module.scss";

export interface IDateFieldSectionListProps {
  fieldState: IDateFieldState;
  onFieldStateChange: (state: IDateFieldState) => void;
  onKeyDownExtra?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export const DateFieldSectionList = forwardRef<
  HTMLDivElement,
  IDateFieldSectionListProps
>(function DateFieldSectionList(
  {
    fieldState,
    onFieldStateChange,
    onKeyDownExtra,
    onBlur,
    autoFocus = true,
    className,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

  useEffect(() => {
    if (!autoFocus) return;
    rootRef.current?.focus();
  }, [autoFocus]);

  const handleSectionClick = useCallback(
    (index: number) => {
      onFieldStateChange(setActiveSection(fieldState, index));
      rootRef.current?.focus();
    },
    [fieldState, onFieldStateChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === "Tab") {
        onKeyDownExtra?.(e);
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const { state } = applyDigit(fieldState, e.key);
        onFieldStateChange(state);
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onFieldStateChange(applyBackspace(fieldState));
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onFieldStateChange(moveSection(fieldState, -1));
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        onFieldStateChange(moveSection(fieldState, 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        onFieldStateChange(incrementSection(fieldState, 1));
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        onFieldStateChange(incrementSection(fieldState, -1));
        return;
      }

      onKeyDownExtra?.(e);
    },
    [fieldState, onFieldStateChange, onKeyDownExtra],
  );

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  return (
    <div
      ref={rootRef}
      className={[styles.fieldRoot, className].filter(Boolean).join(" ")}
      tabIndex={0}
      role="group"
      aria-haspopup="dialog"
      aria-expanded
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      {fieldState.sections.map((section, index) => {
        const { text, isPlaceholder } = getSectionDisplayText(section);
        const isActive = index === fieldState.activeSectionIndex;
        const numericValue = isPlaceholder
          ? undefined
          : Number.parseInt(section.query, 10);

        return (
          <span key={`${section.type}-${index}`}>
            {index > 0 && (
              <span className={styles.separator}>{fieldState.separator}</span>
            )}
            <span
              className={[
                styles.section,
                isActive ? styles.sectionActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-section-index={index}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSectionClick(index)}
            >
              <span
                className={[
                  styles.sectionContent,
                  isPlaceholder ? styles.sectionPlaceholder : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="spinbutton"
                aria-valuenow={numericValue}
                aria-valuetext={isPlaceholder ? undefined : text}
                aria-label={section.type}
              >
                {text}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
});
