import { cva } from "class-variance-authority";

export function useToast() {
  return { show: (message: string) => message };
}

export const cn = (...parts: string[]) => parts.join(" ");

export const Sizes = ["sm", "md"] as const;

export enum ButtonVariant {
  Solid = "solid",
  Outline = "outline",
}

export const ButtonVariants = cva("btn");

export function FormatDate(date: Date): string {
  return date.toISOString();
}

export class ToastManager {
  constructor(readonly options: { max: number }) {}
}

export type { A1Props } from "../a-declarations/a1-a2";

export function Excluded(props: { label: string }) {
  return <span>{props.label}</span>;
}

export { Untyped } from "./untyped";

export class Printer {
  render() {
    return "printed";
  }
}
