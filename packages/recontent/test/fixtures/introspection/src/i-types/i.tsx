import type { CSSProperties } from "react";
import type { D11Props } from "@/types";
import type { Entry as EntryA } from "./entry-a";
import type { Entry as EntryB } from "./entry-b";
import type {
  Box,
  Direction,
  Key,
  TabAttributes,
  TabItem,
  TabSize,
  Tone,
  TreeNode,
} from "./models";

export function I1(props: { items: TabItem[] }) {
  return <ul>{props.items.length}</ul>;
}

export function I2(props: { size: TabSize }) {
  return <span>{props.size}</span>;
}

export function I3(props: { direction: Direction }) {
  return <span>{props.direction}</span>;
}

export function I4(props: { registry: Record<Key, TabItem> }) {
  return <span>{Object.keys(props.registry).length}</span>;
}

export function I5(props: { tree: TreeNode }) {
  return <span>{props.tree.value}</span>;
}

export function I6(props: { attributes: TabAttributes }) {
  return <span>{props.attributes.tone}</span>;
}

export function I7<T>(props: { box: Box<T>; value: T }) {
  return <span>{String(props.box.value)}</span>;
}

export function I8(props: { style: CSSProperties; onClick: (event: MouseEvent) => void }) {
  return <span style={props.style} />;
}

export function I9(props: { header: D11Props }) {
  return <h1>{props.header.title}</h1>;
}

export function I10(props: { first: EntryA; second: EntryB }) {
  return <span>{props.first.a + props.second.b}</span>;
}

const config = { items: [] as TabItem[] };

export function I11(props: typeof config) {
  return <span>{props.items.length}</span>;
}

export function I12(props: { onPick(tone: Tone): void }) {
  return <span onClick={() => props.onPick("info")} />;
}
