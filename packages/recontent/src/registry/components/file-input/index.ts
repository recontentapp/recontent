import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import type { IconName } from "../../internal/icon-map/icons.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateFileInputSources } from "./vanilla-extract.js";

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
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
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
  },
});
