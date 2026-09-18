import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock, groupVariantIcons, groupVariantTokens } from "../shared.js";

const STATUS_FIELDS = [
  "color",
  "backgroundColor",
  "borderColor",
  "iconColor",
  "titleColor",
] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function statusRootStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      color: ${fields.color!.reference},
      backgroundColor: ${fields.backgroundColor!.reference},
      borderColor: ${fields.borderColor!.reference},
    }`;
}

function statusIconStyleBody(fields: Record<string, TokenImport>): string {
  return `{ color: ${fields.iconColor!.reference} }`;
}

function statusTitleStyleBody(fields: Record<string, TokenImport>): string {
  return `{ color: ${fields.titleColor!.reference} }`;
}

export function generateBannerSources(bindings: {
  border: TokenImport;
  borderRadius: TokenImport;
  typography: TokenImport;
  titleTypography: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  iconSize: TokenImport;
  closeIcon: string;
  tokens: Record<string, TokenImport>;
  icons: Record<string, string>;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    border,
    borderRadius,
    typography,
    titleTypography,
    horizontalSpacing,
    verticalSpacing,
    gap,
    iconSize,
    closeIcon,
    tokens,
    icons,
    focusRingColor,
  } = bindings;
  const statuses = groupVariantTokens(tokens, "statuses", STATUS_FIELDS);
  const statusNames = Object.keys(statuses);
  const statusIcons = groupVariantIcons(icons, "statuses", ["icon"]);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const bannerRoot = style({
  display: "flex",
  alignItems: "flex-start",
  boxSizing: "border-box",
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  gap: ${gap.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference)},
});

export const bannerStatus = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusRootStyleBody(statuses[name]!)},`).join("\n")}
});

export const bannerIcon = style({
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const bannerLeadingIcon = style([
  bannerIcon,
  {
    // Nudges the icon down so its optical center lines up with the title's
    // cap-height instead of the top of its line box (which includes leading).
    marginTop: "0.125em",
  },
]);

export const bannerStatusIconColor = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusIconStyleBody(statuses[name]!)},`).join("\n")}
});

export const bannerContent = style({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: ${gap.reference},
});

export const bannerTitle = style({
  margin: 0,
  ${typographyProps(titleTypography.reference)},
});

export const bannerStatusTitleColor = styleVariants({
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${statusTitleStyleBody(statuses[name]!)},`).join("\n")}
});

export const bannerActions = style({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  gap: ${gap.reference},
});

export const bannerDismiss = style({
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: "inherit",
  ${focusRingBlock(focusRingColor)}
});
`,
    component: `import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  bannerActions,
  bannerContent,
  bannerDismiss,
  bannerIcon,
  bannerLeadingIcon,
  bannerRoot,
  bannerStatus,
  bannerStatusIconColor,
  bannerStatusTitleColor,
  bannerTitle,
} from "./Banner.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type BannerStatusToken = ${statusNames.map((n) => JSON.stringify(n)).join(" | ")};

const STATUS_ICONS: Record<BannerStatusToken, IconType> = {
${statusNames.map((name) => `  ${JSON.stringify(name)}: ${JSON.stringify(statusIcons[name]!.icon)} as IconType,`).join("\n")}
};

export interface BannerProps extends CommonComponentProps {
  status?: BannerStatusToken;
  title?: ReactNode;
  /** \`false\` opts out of the status' default icon. */
  icon?: IconType | false;
  onDismiss?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  render?: RenderProp<"div">;
}

export function Banner({
  status = ${JSON.stringify(statusNames[0] ?? "info")},
  title,
  icon,
  onDismiss,
  actions,
  className,
  render,
  children,
  ...props
}: BannerProps) {
  const iconKey = icon === false ? undefined : (icon ?? STATUS_ICONS[status]);
  const Icon = iconKey ? icons[iconKey] : undefined;
  const CloseIcon = icons[${JSON.stringify(closeIcon)}];

  const classes = [bannerRoot, bannerStatus[status], className].filter(Boolean).join(" ");

  const content = (
    <>
      {Icon && <Icon className={[bannerLeadingIcon, bannerStatusIconColor[status]].join(" ")} aria-hidden="true" />}
      <div className={bannerContent}>
        {title !== undefined && (
          <p className={[bannerTitle, bannerStatusTitleColor[status]].join(" ")}>{title}</p>
        )}
        {children}
      </div>
      {(actions !== undefined || onDismiss) && (
        <div className={bannerActions}>
          {actions}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={bannerDismiss}
              aria-label="Dismiss"
            >
              <CloseIcon className={bannerIcon} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </>
  );

  const rootProps: Record<string, unknown> = {
    ...props,
    role: "status",
    "data-slot": "banner",
    className: classes,
    children: content,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}
