import type { HTMLAttributes } from "react";

export type IconName = "home" | "search";

export type BaseSize = "sm" | "md";

export type TabSize = BaseSize;

/** One entry of a tab list. */
export interface TabItem {
  id: string;
  label: string;
  /** Shown before the label. */
  icon?: IconName;
}

export enum Direction {
  Up = "up",
  Down = "down",
}

export type Key = string;

export interface TreeNode {
  value: string;
  children: TreeNode[];
}

export type Tone = "info" | "warn";

export interface TabAttributes extends HTMLAttributes<HTMLDivElement> {
  tone: Tone;
}

export interface Box<T> {
  value: T;
}
