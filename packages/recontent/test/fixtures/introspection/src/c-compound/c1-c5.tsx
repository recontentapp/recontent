import type { ReactNode } from "react";

function TabsRoot(props: { value: string; children?: ReactNode }) {
  return <div>{props.children}</div>;
}
function List(props: { label?: string }) {
  return <ul>{props.label}</ul>;
}
function Tab(props: { id: string }) {
  return <li>{props.id}</li>;
}
function Panel(props: { id: string }) {
  return <div>{props.id}</div>;
}

export const Tabs = Object.assign(TabsRoot, { List, Tab, Panel });

function C2Header(props: { title: string }) {
  return <header>{props.title}</header>;
}

export function C2(props: { elevated?: boolean }) {
  return <div>{String(props.elevated)}</div>;
}
C2.Header = C2Header;

function MenuRoot(props: { open?: boolean }) {
  return <div>{String(props.open)}</div>;
}
function MenuItem(props: { label: string }) {
  return <li>{props.label}</li>;
}

export const Menu = { Root: MenuRoot, Item: MenuItem };

export const C5Provider = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: "light" | "dark";
}) => <div data-theme={theme}>{children}</div>;
