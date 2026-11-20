import type { ColorSpace, Component } from "./spaces.js";

export type ParsedCssColor = {
  colorSpace: ColorSpace;
  components: [Component, Component, Component];
  alpha: number;
};

const FUNCTION_RE = /^([a-z-]+)\(\s*([^()]*?)\s*\)$/i;

// What 100% stands for in each channel of a CSS color function.
const PERCENT_BASE = {
  rgb: [255, 255, 255],
  lab: [100, 125, 125],
  lch: [100, 150, 360],
  oklab: [1, 0.4, 0.4],
  oklch: [1, 0.4, 360],
} as const;

const PREDEFINED_SPACES: readonly ColorSpace[] = [
  "srgb",
  "srgb-linear",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
  "xyz-d65",
  "xyz-d50",
];

const ANGLE_TO_DEGREES: Record<string, number> = {
  deg: 1,
  grad: 360 / 400,
  rad: 180 / Math.PI,
  turn: 360,
};

function fail(input: string, reason: string): never {
  throw new Error(`Invalid CSS color: ${JSON.stringify(input)}. ${reason}`);
}

function parseNumber(token: string, input: string): number {
  const value = Number(token);
  if (token === "" || !Number.isFinite(value)) fail(input, `Unexpected value "${token}".`);
  return value;
}

/** A channel: a number, a percentage (scaled by `percentBase`, `null` when unsupported) or `none`. */
function parseChannel(token: string, percentBase: number | null, input: string): Component {
  if (token === "none") return "none";
  if (token.endsWith("%")) {
    if (percentBase === null) fail(input, `Unexpected percentage "${token}".`);
    return (parseNumber(token.slice(0, -1), input) * percentBase) / 100;
  }
  return parseNumber(token, input);
}

/** The percentage channels of hsl() and hwb() are stored as 0-100, with or without the `%`. */
function parsePercentChannel(token: string, input: string): Component {
  return token === "none" ? "none" : parseNumber(token.replace(/%$/, ""), input);
}

function parseHue(token: string, input: string): Component {
  if (token === "none") return "none";
  const unit = /(deg|grad|rad|turn)$/.exec(token)?.[1];
  const degrees = unit
    ? parseNumber(token.slice(0, -unit.length), input) * ANGLE_TO_DEGREES[unit]!
    : parseNumber(token, input);
  return ((degrees % 360) + 360) % 360;
}

function parseAlpha(token: string | undefined, input: string): number {
  if (token === undefined) return 1;
  const alpha = parseChannel(token, 1, input);
  if (alpha === "none") fail(input, 'An alpha of "none" is not supported.');
  return alpha;
}

/** Splits `a b c / d` and the legacy `a, b, c, d` into channels and an optional alpha. */
function splitArguments(body: string, input: string): { channels: string[]; alpha?: string } {
  const [colorPart, alpha, ...rest] = body.split("/").map((part) => part.trim());
  if (rest.length > 0) fail(input, 'Expected at most one "/".');
  const channels = colorPart!.includes(",")
    ? colorPart!.split(",").map((part) => part.trim())
    : colorPart!.split(/\s+/);

  // Legacy syntax carries alpha as a fourth comma-separated value.
  if (alpha === undefined && colorPart!.includes(",") && channels.length === 4) {
    return { channels: channels.slice(0, 3), alpha: channels[3]! };
  }
  return alpha === undefined ? { channels } : { channels, alpha };
}

/**
 * Parses a CSS color function — `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`,
 * `oklch()` or `color(<space> ...)` — in its modern (space separated) or legacy (comma
 * separated) syntax. Hex colors and named colors are not handled here.
 */
export function parseCssColor(input: string): ParsedCssColor {
  const match = FUNCTION_RE.exec(input.trim());
  if (!match)
    fail(input, 'Expected a hex color or a CSS color function like "oklch(0.7 0.1 250)".');

  const fn = match[1]!.toLowerCase();
  const { channels, alpha } = splitArguments(match[2]!.toLowerCase(), input);

  let space: string = fn;
  if (fn === "color") {
    space = channels.shift() ?? "";
    if (space === "xyz") space = "xyz-d65";
  } else if (fn === "rgba") {
    space = "rgb";
  } else if (fn === "hsla") {
    space = "hsl";
  }
  if (channels.length !== 3) {
    fail(input, `Expected 3 color channels, received ${channels.length}.`);
  }
  const [c0, c1, c2] = channels as [string, string, string];
  const alphaValue = parseAlpha(alpha, input);

  switch (space) {
    case "rgb": {
      const base = PERCENT_BASE.rgb;
      const [r, g, b] = [c0, c1, c2].map((token, index) =>
        parseChannel(token, base[index]!, input),
      ) as [Component, Component, Component];
      const scale = (v: Component): Component => (v === "none" ? v : v / 255);
      return { colorSpace: "srgb", components: [scale(r), scale(g), scale(b)], alpha: alphaValue };
    }
    case "hsl":
    case "hwb":
      return {
        colorSpace: space,
        components: [
          parseHue(c0, input),
          parsePercentChannel(c1, input),
          parsePercentChannel(c2, input),
        ],
        alpha: alphaValue,
      };
    case "lab":
    case "oklab": {
      const base = PERCENT_BASE[space];
      return {
        colorSpace: space,
        components: [
          parseChannel(c0, base[0], input),
          parseChannel(c1, base[1], input),
          parseChannel(c2, base[2], input),
        ],
        alpha: alphaValue,
      };
    }
    case "lch":
    case "oklch": {
      const base = PERCENT_BASE[space];
      return {
        colorSpace: space,
        components: [
          parseChannel(c0, base[0], input),
          parseChannel(c1, base[1], input),
          parseHue(c2, input),
        ],
        alpha: alphaValue,
      };
    }
    default: {
      const predefined = PREDEFINED_SPACES.find((candidate) => candidate === space);
      if (fn !== "color" || !predefined) {
        fail(input, `Unsupported color function or space "${space}".`);
      }
      return {
        colorSpace: predefined,
        components: [
          parseChannel(c0, 1, input),
          parseChannel(c1, 1, input),
          parseChannel(c2, 1, input),
        ],
        alpha: alphaValue,
      };
    }
  }
}
