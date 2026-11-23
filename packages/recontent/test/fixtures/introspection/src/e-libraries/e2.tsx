import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentPropsWithoutRef } from "react";

type E2Props = ComponentPropsWithoutRef<typeof BaseDialog.Popup> & { size?: "sm" | "md" };

export function E2({ size, ...props }: E2Props) {
  return <BaseDialog.Popup {...props} data-size={size} />;
}
