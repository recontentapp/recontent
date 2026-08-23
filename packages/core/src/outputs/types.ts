import type { ScaleBinding, TokenBinding } from "../tokens/model.js";

export type BuiltInComponentsInput =
  | Record<string, Record<string, unknown> | undefined>
  | readonly string[];

export type OutputTarget = "css" | "vanilla-extract" | "typescript" | "typescript-native";
export interface CssOutput {
  target: "css";
  outDir: string;
}
export interface VanillaExtractOutput {
  target: "vanilla-extract";
  outDir: string;
  builtInComponents?: BuiltInComponentsInput;
  /** Optional. When omitted, no focus-ring styles are generated. */
  focusRingColor?: TokenBinding<"color">;
  fontFamily: TokenBinding<"fontFamily">;
  placeholderColor: TokenBinding<"color">;
  breakpoints?: ScaleBinding<"dimension">;
}
export interface TypeScriptOutput {
  target: "typescript";
  outDir: string;
}
export interface TypeScriptNativeOutput {
  target: "typescript-native";
  outDir: string;
  rootFontSize?: number;
}
export type Output = CssOutput | VanillaExtractOutput | TypeScriptOutput | TypeScriptNativeOutput;
export type OutputFile = { filename: string; content: string; writeMode?: "always" | "once" };
