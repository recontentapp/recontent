import type { ReactNode } from "react";
import type { CommonComponentProps } from "./generated/renderElement.gen";

export type StickerTilt = "none" | "left" | "right";

export interface StickerProps extends CommonComponentProps {
  /** Rotation applied to the sticker. */
  tilt?: StickerTilt;
  children?: ReactNode;
}

/**
 * Playful label stuck on the corner of a card or an image.
 *
 * @experimental The API may change while we collect feedback.
 *
 * @link <caption>Figma</caption> https://figma.com/docs/sticker
 *
 * @usage ./Sticker.usage.md
 *
 * @example <caption>Basic</caption> ./examples/Sticker.basic.tsx
 * @example <caption>Tilted</caption> ./examples/Sticker.tilted.tsx
 * @example <caption>In a card</caption> ./examples/Sticker.card.tsx
 *
 * @category Data display
 */
export function Sticker({ tilt = "none", className, children, ...props }: StickerProps) {
  return (
    <span {...props} data-slot="sticker" data-tilt={tilt} className={className}>
      {children}
    </span>
  );
}
