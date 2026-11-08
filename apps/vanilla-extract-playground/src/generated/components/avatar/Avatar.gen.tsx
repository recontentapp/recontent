import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import {
  avatarFallback,
  avatarImage,
  avatarRoot,
  avatarShapeSquare,
  avatarSize,
} from "./Avatar.gen.css";
import type { RefIconScale as AvatarSizeToken } from "../../tokens.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface AvatarProps extends CommonComponentProps {
  src?: string;
  alt?: string;
  text?: string;
  size?: AvatarSizeToken;
  shape?: "circle" | "square";
  render?: RenderProp<"span">;
}

/**
 * Image or initials identifying a person or an entity.
 *
 * @usage Use next to names, in lists and in comments. Falls back to `text` when the image is
 * missing, so always pass `alt` or `text`.
 *
 * @example
 * <Avatar src="/people/ada.png" alt="Ada Lovelace" text="AL" shape="circle" />
 *
 * @category Data display
 */
export function Avatar({
  src,
  alt,
  text,
  size,
  shape = "circle",
  className,
  render,
  ...props
}: AvatarProps) {
  const classes = [
    avatarRoot,
    size !== undefined && avatarSize[size],
    shape === "square" && avatarShapeSquare,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseAvatar.Root {...props} render={render} className={classes} data-slot="avatar">
      {src && <BaseAvatar.Image src={src} alt={alt} className={avatarImage} />}
      <BaseAvatar.Fallback className={avatarFallback}>{text}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
