export function H1(props: { label: string; broken: DoesNotExist }) {
  return <span>{props.label}</span>;
}

interface TreeItemProps {
  label: string;
  children?: TreeItemProps[];
}

export function H3(props: TreeItemProps) {
  return <li>{props.label}</li>;
}
