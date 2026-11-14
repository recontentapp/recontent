import * as React from "react";
import { type FC } from "react";

type Props = { label: string };

export const A3: React.FC<Props> = ({ label }) => <span>{label}</span>;
export const A4a: React.FunctionComponent<Props> = ({ label }) => <span>{label}</span>;
export const A4b: FC<Props> = ({ label }) => <span>{label}</span>;
