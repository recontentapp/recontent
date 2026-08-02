import { PropsWithChildren } from "react";

export interface BoxProps extends PropsWithChildren {}

export const Box = ({ children }: BoxProps) => {
  return <div>{children}</div>;
};
