import type { ReactNode } from "react";
import { Field as BaseField } from "@base-ui/react/field";
import {
  fieldDescription,
  fieldErrorIcon,
  fieldErrorRow,
  fieldLabel,
  fieldLabelRow,
  fieldOptionalText,
  fieldRequiredIndicator,
  fieldRoot,
} from "./Field.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const ErrorIcon = icons["alert"];

export interface FieldProps extends CommonComponentProps {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Shown next to the label when the field is not required. */
  optionalText?: ReactNode;
  children: ReactNode;
  render?: RenderProp<"div">;
}

export function Field({
  label,
  description,
  error,
  required = false,
  optionalText,
  className,
  render,
  children,
  ...props
}: FieldProps) {
  const classes = [fieldRoot, className].filter(Boolean).join(" ");

  return (
    <BaseField.Root
      {...props}
      invalid={error !== undefined}
      render={render}
      className={classes}
      data-slot="field"
    >
      {(label !== undefined || (!required && optionalText !== undefined)) && (
        <span className={fieldLabelRow}>
          {label !== undefined && (
            <BaseField.Label className={fieldLabel}>
              {label}
              {required && <span className={fieldRequiredIndicator}>*</span>}
            </BaseField.Label>
          )}
          {!required && optionalText !== undefined && (
            <span className={fieldOptionalText}>{optionalText}</span>
          )}
        </span>
      )}
      {children}
      {description !== undefined && (
        <BaseField.Description className={fieldDescription}>{description}</BaseField.Description>
      )}
      {error !== undefined && (
        <BaseField.Error className={fieldErrorRow} match={true}>
          <ErrorIcon className={fieldErrorIcon} aria-hidden="true" />
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}
