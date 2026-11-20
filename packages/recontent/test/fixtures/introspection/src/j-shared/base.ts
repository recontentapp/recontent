import type { ReactNode } from "react";

export type Scale = {
  gap: 0 | 4 | 8;
  /** More literals than a table shows. */
  color:
    | "c1"
    | "c2"
    | "c3"
    | "c4"
    | "c5"
    | "c6"
    | "c7"
    | "c8"
    | "c9"
    | "c10"
    | "c11"
    | "c12"
    | "c13"
    | "c14";
};

export interface BaseProps {
  gap?: Scale["gap"];
  color?: Scale["color"];
  children?: Holder["child"];
}

export interface Holder {
  child: ReactNode;
}
