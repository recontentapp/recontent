import type { ComponentSourceGenerator } from "../types.js";
import { generateStackSources } from "./stack/index.js";
import { generateBadgeSources } from "./badge/index.js";
import { generateDividerSources } from "./divider/index.js";
import { generateSkeletonSources } from "./skeleton/index.js";
import { generateStatusDotSources } from "./status-dot/index.js";
import { generateTextSources } from "./text/index.js";
import { generateHeadingSources } from "./heading/index.js";
import { generateKbdSources } from "./kbd/index.js";
import { generateBlockquoteSources } from "./blockquote/index.js";
import { generateCitationSources } from "./citation/index.js";
import { generateTimestampSources } from "./timestamp/index.js";
import { generateCardSources } from "./card/index.js";
import { generateSectionSources } from "./section/index.js";
import { generateGridSources } from "./grid/index.js";
import { generateGridSpanSources } from "./grid-span/index.js";
import { generateVisuallyHiddenSources } from "./visually-hidden/index.js";
import { generateAspectRatioSources } from "./aspect-ratio/index.js";
import { generateCenterSources } from "./center/index.js";

export const componentSourceGenerators: Record<string, ComponentSourceGenerator> = {
  stack: ({ scales, tokens }) =>
    generateStackSources({ gapScale: scales.gapScale!, backgroundColor: tokens.backgroundColor! }),
  badge: ({ tokens }) => generateBadgeSources({ tokens }),
  divider: ({ tokens }) => generateDividerSources({ tokens }),
  skeleton: ({ tokens }) => generateSkeletonSources({ tokens }),
  "status-dot": ({ tokens }) => generateStatusDotSources({ tokens }),
  text: ({ tokens }) => generateTextSources({ tokens }),
  heading: ({ tokens }) => generateHeadingSources({ tokens }),
  kbd: ({ tokens }) => generateKbdSources({ tokens }),
  blockquote: ({ tokens }) => generateBlockquoteSources({ tokens }),
  citation: ({ tokens }) => generateCitationSources({ tokens }),
  timestamp: ({ tokens }) => generateTimestampSources({ tokens }),
  card: ({ tokens }) => generateCardSources({ tokens }),
  section: ({ tokens }) => generateSectionSources({ tokens }),
  grid: ({ scales }) => generateGridSources({ gapScale: scales.gapScale! }),
  "grid-span": () => generateGridSpanSources(),
  "visually-hidden": () => generateVisuallyHiddenSources(),
  "aspect-ratio": () => generateAspectRatioSources(),
  center: () => generateCenterSources(),
};
