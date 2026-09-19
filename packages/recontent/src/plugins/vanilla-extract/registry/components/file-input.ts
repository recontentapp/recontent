import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, typographyProps } from "./shared.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";
function generateFileInputSources(bindings: {
  border: TokenImport;
  borderRadius: TokenImport;
  backgroundColor: TokenImport;
  color: TokenImport;
  typography: TokenImport;
  hoverBorderColor: TokenImport;
  draggingBorderColor: TokenImport;
  draggingBackgroundColor: TokenImport;
  invalidBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  iconSize: TokenImport;
  fileTypography: TokenImport;
  fileColor: TokenImport;
  fileBorderRadius: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  uploadIcon: string;
  removeIcon: string;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    border,
    borderRadius,
    backgroundColor,
    color,
    typography,
    hoverBorderColor,
    draggingBorderColor,
    draggingBackgroundColor,
    invalidBorderColor,
    disabledBackgroundColor,
    disabledColor,
    horizontalSpacing,
    verticalSpacing,
    gap,
    iconSize,
    fileTypography,
    fileColor,
    fileBorderRadius,
    uploadIcon,
    removeIcon,
    focusRingColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const fileInputRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: ${gap.reference},
});

export const fileInputDropzone = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: "100%",
  cursor: "pointer",
  textAlign: "center",
  gap: ${gap.reference},
  color: ${color.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference, "      ")},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  selectors: {
    "&[data-dragging]": {
      borderColor: ${draggingBorderColor.reference},
      backgroundColor: ${draggingBackgroundColor.reference},
    },
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledBackgroundColor.reference},
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
  ${focusRingBlock(focusRingColor)}
});

export const fileInputButton = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: ${gap.reference},
  color: ${color.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference, "      ")},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledBackgroundColor.reference},
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
  ${focusRingBlock(focusRingColor)}
});

export const fileInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const fileInputHidden = style({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});

export const fileInputList = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: ${gap.reference},
});

export const fileInputFile = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxSizing: "border-box",
  gap: ${gap.reference},
  color: ${fileColor.reference},
  borderRadius: ${fileBorderRadius.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(fileTypography.reference, "      ")},
});

export const fileInputFileName = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const fileInputRemove = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
  ${focusRingBlock(focusRingColor)}
});
`,
    component: `import { useRef, useState, type ComponentPropsWithoutRef, type DragEvent, type ReactNode } from "react";
import {
  fileInputButton,
  fileInputDropzone,
  fileInputFile,
  fileInputFileName,
  fileInputHidden,
  fileInputIcon,
  fileInputList,
  fileInputRemove,
  fileInputRoot,
} from "./FileInput.gen.css";
import { renderElement, type CommonComponentProps, type FieldableInputProps, type RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const UploadIcon = icons[${JSON.stringify(uploadIcon)}];
const RemoveIcon = icons[${JSON.stringify(removeIcon)}];

export interface FileInputProps extends CommonComponentProps, FieldableInputProps {
  accept?: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  files?: File[];
  defaultFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  onRejected?: (reason: "type" | "size", files: File[]) => void;
  /** Renders the large drop target instead of a plain button. */
  dropzone?: boolean;
  label?: ReactNode;
  render?: RenderProp<"input">;
}

function matchesAccept(file: File, accept: string): boolean {
  return accept.split(",").some((pattern) => {
    const trimmed = pattern.trim();
    if (!trimmed) return true;
    if (trimmed.startsWith(".")) return file.name.toLowerCase().endsWith(trimmed.toLowerCase());
    if (trimmed.endsWith("/*")) return file.type.startsWith(trimmed.slice(0, -1));
    return file.type === trimmed;
  });
}

export function FileInput({
  accept,
  multiple = false,
  maxSizeBytes,
  files,
  defaultFiles = [],
  onFilesChange,
  onRejected,
  dropzone = true,
  label,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: FileInputProps) {
  const [uncontrolledFiles, setUncontrolledFiles] = useState<File[]>(defaultFiles);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = files !== undefined;
  const currentFiles = isControlled ? files : uncontrolledFiles;

  function commitFiles(candidates: File[]) {
    const accepted: File[] = [];
    const rejectedByType: File[] = [];
    const rejectedBySize: File[] = [];

    for (const file of candidates) {
      if (accept && !matchesAccept(file, accept)) {
        rejectedByType.push(file);
        continue;
      }
      if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        rejectedBySize.push(file);
        continue;
      }
      accepted.push(file);
    }

    if (rejectedByType.length > 0) onRejected?.("type", rejectedByType);
    if (rejectedBySize.length > 0) onRejected?.("size", rejectedBySize);

    const next = multiple ? [...currentFiles, ...accepted] : accepted.slice(0, 1);
    if (!isControlled) setUncontrolledFiles(next);
    onFilesChange?.(next);
  }

  function removeFile(index: number) {
    const next = currentFiles.filter((_, i) => i !== index);
    if (!isControlled) setUncontrolledFiles(next);
    onFilesChange?.(next);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    commitFiles(Array.from(event.dataTransfer.files));
  }

  const classes = [dropzone ? fileInputDropzone : fileInputButton, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fileInputRoot} data-slot="file-input">
      <div
        className={classes}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-dragging={isDragging || undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            !disabled && inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <UploadIcon className={fileInputIcon} aria-hidden="true" />
        {label}
        {renderElement(
          "input",
          render,
          {
            ...props,
            ref: inputRef,
            type: "file",
            accept,
            multiple,
            name,
            required,
            disabled,
            onFocus,
            onBlur,
            onChange: (event) => {
              commitFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            },
            className: fileInputHidden,
          } as ComponentPropsWithoutRef<"input">,
        )}
      </div>
      {currentFiles.length > 0 && (
        <ul className={fileInputList}>
          {currentFiles.map((file, index) => (
            <li key={\`\${file.name}-\${index}\`} className={fileInputFile}>
              <span className={fileInputFileName}>{file.name}</span>
              <button
                type="button"
                className={fileInputRemove}
                aria-label={\`Remove \${file.name}\`}
                onClick={() => removeFile(index)}
              >
                <RemoveIcon className={fileInputIcon} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
`,
  };
}

export type FileInputComponentOptions = {
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  hoverBorderColor: TokenBinding<"color">;
  draggingBorderColor: TokenBinding<"color">;
  draggingBackgroundColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  fileTypography: TokenBinding<"typography">;
  fileColor: TokenBinding<"color">;
  fileBorderRadius: TokenBinding<"dimension">;
  uploadIcon: IconName;
  removeIcon: IconName;
};

export const fileInputComponent = defineRegistryComponent<FileInputComponentOptions>()({
  id: "file-input",
  name: "FileInput",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    border: {
      kind: "token",
      type: "border",
      description: "Dashed border around the dropzone.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the dropzone.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the dropzone.",
    },
    color: { kind: "token", type: "color", description: "Text color of the dropzone." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the dropzone.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the dropzone on hover.",
    },
    draggingBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the dropzone while a file is dragged over it.",
    },
    draggingBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the dropzone while a file is dragged over it.",
    },
    invalidBorderColor: { kind: "token", type: "color", description: "Border color when invalid." },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the dropzone when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the dropzone when disabled.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the dropzone.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the dropzone.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the dropzone and the file list.",
    },
    iconSize: { kind: "token", type: "dimension", description: "Size of the upload/remove icons." },
    fileTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of a listed file's name.",
    },
    fileColor: { kind: "token", type: "color", description: "Text color of a listed file." },
    fileBorderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of a listed file's row.",
    },
    uploadIcon: { kind: "icon", description: "Icon rendered in the dropzone." },
    removeIcon: {
      kind: "icon",
      description: "Icon used to remove a listed file.",
    },
  },
  output: vanillaExtractComponentOutput(
    "file-input",
    "FileInput",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateFileInputSources({
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        hoverBorderColor: tokens.hoverBorderColor!,
        draggingBorderColor: tokens.draggingBorderColor!,
        draggingBackgroundColor: tokens.draggingBackgroundColor!,
        invalidBorderColor: tokens.invalidBorderColor!,
        disabledBackgroundColor: tokens.disabledBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
        iconSize: tokens.iconSize!,
        fileTypography: tokens.fileTypography!,
        fileColor: tokens.fileColor!,
        fileBorderRadius: tokens.fileBorderRadius!,
        uploadIcon: icons.uploadIcon!,
        removeIcon: icons.removeIcon!,
        focusRingColor,
      }),
  ),
});
