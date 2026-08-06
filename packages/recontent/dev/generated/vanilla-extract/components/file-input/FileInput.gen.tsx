import { useRef, useState, type ComponentPropsWithoutRef, type DragEvent, type ReactNode } from "react";
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

const UploadIcon = icons["info"];
const RemoveIcon = icons["close"];

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
            <li key={`${file.name}-${index}`} className={fileInputFile}>
              <span className={fileInputFileName}>{file.name}</span>
              <button
                type="button"
                className={fileInputRemove}
                aria-label={`Remove ${file.name}`}
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
