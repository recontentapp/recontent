import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateSkeletonSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Skeleton", tokens, ["backgroundColor", "borderRadius"]);

  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { keyframes, style } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

const skeletonPulse = keyframes({
  "0%": { opacity: 1 },
  "50%": { opacity: 0.5 },
  "100%": { opacity: 1 },
});

export const skeletonRoot = style({
  borderRadius: ${tokens.borderRadius?.reference},
  backgroundColor: ${tokens.backgroundColor?.reference},
  animation: \`\${skeletonPulse} 2s ease-in-out infinite\`,
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { skeletonRoot } from "./Skeleton.gen.css";

export type SkeletonProps = ComponentPropsWithoutRef<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  const classes = [skeletonRoot, className].filter(Boolean).join(" ");

  return <div data-slot="skeleton" {...props} className={classes} />;
}
`,
  };
}
