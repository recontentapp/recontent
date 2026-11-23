import type { DialogRootProps } from "@base-ui/react/dialog";

// Keys named with `Pick` are the project's own props, wherever the Pick sits.

interface E4Props extends Pick<DialogRootProps, "defaultOpen" | "modal"> {}

export function E4({ defaultOpen = false, modal = true }: E4Props) {
  return <div data-open={defaultOpen} data-modal={modal} />;
}

type E5Props = Pick<DialogRootProps, "defaultOpen"> & { own?: string };

export function E5({ own }: E5Props) {
  return <div>{own}</div>;
}

// The alias is replaced by E6Props: only its declaration still says `Pick`.
type E6Props = Pick<DialogRootProps, "defaultOpen">;

export function E6(_props: E6Props) {
  return <div />;
}

interface E7Props extends Partial<Pick<DialogRootProps, "modal">> {}

export function E7(_props: E7Props) {
  return <div />;
}

// `Omit` keeps everything the project never named: still inherited.
type E8Props = Omit<DialogRootProps, "children">;

export function E8(_props: E8Props) {
  return <div />;
}
