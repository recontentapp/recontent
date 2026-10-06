// Generates a 12-step UI color scale from one color, following the approach of Radix Colors'
// custom palette generator (https://www.radix-ui.com/colors/custom): rather than computing
// lightness steps, it starts from hand-tuned reference scales, blends the two closest to the
// input color, re-hues them, and moves the lightness curve to sit on the page background.
import { toOklch } from "@recontentapp/core";
import { COLORED_SCALES, GRAY_SCALES, type ReferenceScale } from "./color-scale-data.js";

type Oklch = [number, number, number];
type Appearance = "light" | "dark";

export const SCALE_STEPS = 12;

/** The page color step 1 sits on: white for light scales, Radix's near-black for dark ones. */
const BACKGROUNDS: Record<Appearance, Oklch> = {
  light: toOklch("srgb", [1, 1, 1]),
  dark: toOklch("srgb", [17 / 255, 17 / 255, 17 / 255]),
};

export type GenerateScaleOptions = {
  base: Oklch;
  /** sRGB hex of `base`; used to detect pure white and black. */
  baseHex: string;
  appearance: Appearance;
  /** Pick from the gray reference scales only, and do not pin step 9 to `base`. */
  neutral: boolean;
};

export type GeneratedScale = {
  steps: Oklch[];
  /** Index of the step that is exactly `base`, if any. */
  baseIndex: number | undefined;
};

// --- Color math -----------------------------------------------------------------------------

type Lab = [number, number, number];

function oklchToLab([l, c, h]: Oklch): Lab {
  const rad = (h * Math.PI) / 180;
  return [l, c * Math.cos(rad), c * Math.sin(rad)];
}

function labToOklch([l, a, b]: Lab): Oklch {
  return [l, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

/** Euclidean distance in OKLab. */
function distance(x: Oklch, y: Oklch): number {
  const [l1, a1, b1] = oklchToLab(x);
  const [l2, a2, b2] = oklchToLab(y);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

function mix(x: Oklch, y: Oklch, ratio: number): Oklch {
  const a = oklchToLab(x);
  const b = oklchToLab(y);
  return labToOklch([
    a[0] + (b[0] - a[0]) * ratio,
    a[1] + (b[1] - a[1]) * ratio,
    a[2] + (b[2] - a[2]) * ratio,
  ]);
}

type Bezier = [number, number, number, number];

/** CSS-style cubic-bezier easing: solves x(t) = input by bisection, then returns y(t). */
function bezier([x1, y1, x2, y2]: Bezier, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const at = (t: number, p1: number, p2: number) =>
    3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid, x1, x2) < x) lo = mid;
    else hi = mid;
  }
  return at((lo + hi) / 2, y1, y2);
}

const LIGHT_MODE_EASING: Bezier = [0, 2, 0, 2];
const DARK_MODE_EASING: Bezier = [1, 0, 1, 0];

/** Shifts the whole progression so it starts at `to`, fading the shift out along `curve`. */
function transposeProgressionStart(to: number, values: number[], curve: Bezier): number[] {
  const last = values.length - 1;
  const diff = values[0]! - to;
  return values.map((n, i) => n - diff * bezier(curve, 1 - i / last));
}

// --- Reference scales -----------------------------------------------------------------------

type ReferenceScales = Record<string, Oklch[]>;

const referenceCache = new Map<string, ReferenceScales>();

function referenceScales(
  all: Record<string, ReferenceScale>,
  appearance: Appearance,
  cacheKey: string,
): ReferenceScales {
  const key = `${cacheKey}:${appearance}`;
  let scales = referenceCache.get(key);
  if (!scales) {
    scales = Object.fromEntries(
      Object.entries(all).map(([name, scale]) => [
        name,
        scale[appearance].map((p3) => toOklch("display-p3", p3)),
      ]),
    );
    referenceCache.set(key, scales);
  }
  return scales;
}

function grayScales(appearance: Appearance): ReferenceScales {
  return referenceScales(GRAY_SCALES, appearance, "gray");
}

function allScales(appearance: Appearance): ReferenceScales {
  return { ...grayScales(appearance), ...referenceScales(COLORED_SCALES, appearance, "colored") };
}

// --- Generation -----------------------------------------------------------------------------

/** Chooses and blends the reference scales closest to `source`, then moves it onto `background`. */
function scaleFromColor(
  source: Oklch,
  scales: ReferenceScales,
  background: Oklch,
  isGray: (scale: string) => boolean,
): Oklch[] {
  const candidates: { scale: string; color: Oklch; distance: number }[] = [];
  for (const [name, scale] of Object.entries(scales)) {
    for (const color of scale) {
      candidates.push({ scale: name, color, distance: distance(source, color) });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance);

  // The closest color of every scale, nearest first.
  const closest = candidates.filter(
    (candidate, i) => i === candidates.findIndex((other) => other.scale === candidate.scale),
  );

  // Grays are all extremely close to each other, so when the nearest scale is a gray the second
  // pick would say nothing about the source; skip to the nearest non-gray one.
  if (!closest.every((c) => isGray(c.scale)) && isGray(closest[0]!.scale)) {
    while (isGray(closest[1]!.scale)) closest.splice(1, 1);
  }

  const colorA = closest[0]!;
  const colorB = closest[1]!;

  // Mixing A and B only helps when the source lies "between" them: in the triangle formed by
  // the source, A and B, neither angle at A nor at B may be obtuse. Then the best base is the
  // point D on AB closest to the source, i.e. B mixed into A in the ratio AD : BD, which is the
  // ratio of the tangents of the angles at the source. Otherwise A alone is the base.
  const a = colorB.distance;
  const b = colorA.distance;
  const c = distance(colorA.color, colorB.color);
  const cosA = Math.min(1, Math.max(-1, (b ** 2 + c ** 2 - a ** 2) / (2 * b * c)));
  const cosB = Math.min(1, Math.max(-1, (a ** 2 + c ** 2 - b ** 2) / (2 * a * c)));
  const tanC1 = cosA / Math.sin(Math.acos(cosA));
  const tanC2 = cosB / Math.sin(Math.acos(cosB));
  const rawRatio = tanC1 / tanC2;
  const ratio = Number.isFinite(rawRatio) ? Math.max(0, rawRatio) * 0.5 : 0;

  const scaleA = scales[colorA.scale]!;
  const scaleB = scales[colorB.scale]!;
  const scale = scaleA.map((color, i) => mix(color, scaleB[i]!, ratio));

  // Match hue and chroma to the source, using the closest step as the chroma reference.
  const baseColor = scale.reduce((best, color) =>
    distance(source, color) < distance(source, best) ? color : best,
  );
  const ratioC = baseColor[1] > 0 ? source[1] / baseColor[1] : 1;
  for (const color of scale) {
    color[1] = Math.min(source[1] * 1.5, color[1] * ratioC);
    color[2] = source[2];
  }

  const backgroundL = Math.max(0, Math.min(1, background[0]));

  // Light scales: put white in front so step 1 lands on the background, then drop it.
  if (scale[0]![0] > 0.5) {
    const lightness = transposeProgressionStart(
      backgroundL,
      [1, ...scale.map((color) => color[0])],
      LIGHT_MODE_EASING,
    );
    lightness.shift();
    lightness.forEach((l, i) => (scale[i]![0] = l));
    return scale;
  }

  // Dark scales: when the background is lighter than step 1, ease the shift out towards linear.
  const ease: Bezier = [...DARK_MODE_EASING];
  const ratioL = backgroundL / scale[0]![0];
  if (ratioL > 1) {
    const maxRatio = 1.5;
    const metaRatio = (ratioL - 1) * (maxRatio / (maxRatio - 1));
    for (let i = 0; i < ease.length; i++) {
      ease[i] = ratioL > maxRatio ? 0 : Math.max(0, ease[i]! * (1 - metaRatio));
    }
  }
  const lightness = transposeProgressionStart(
    backgroundL,
    scale.map((color) => color[0]),
    ease,
  );
  lightness.forEach((l, i) => (scale[i]![0] = l));
  return scale;
}

/** Step 10: a touch darker (or lighter on dark colors) than step 9, borrowing the closest in-scale hue. */
function hoverColor(source: Oklch, scale: Oklch[]): Oklch {
  const [l, c, h] = source;
  const hover: Oklch = [
    l > 0.4 ? l - 0.03 / (l + 0.1) : l + 0.03 / (l + 0.1),
    l > 0.4 && c > 0 ? c * 0.93 : c,
    h,
  ];
  const closest = scale.reduce((best, color) =>
    distance(hover, color) < distance(hover, best) ? color : best,
  );
  return [hover[0], closest[1], closest[2]];
}

export function generateScale(options: GenerateScaleOptions): GeneratedScale {
  const { base, appearance } = options;
  const background = BACKGROUNDS[appearance];
  const grays = grayScales(appearance);
  const isGray = (scale: string) => scale in grays;

  if (options.neutral) {
    return { steps: scaleFromColor(base, grays, background, isGray), baseIndex: undefined };
  }

  // Pure white and black carry no hue, so take the tint of the gray scales instead.
  const achromaticEnd = options.baseHex === "#000000" || options.baseHex === "#ffffff";
  const scale = scaleFromColor(
    base,
    achromaticEnd ? grays : allScales(appearance),
    background,
    isGray,
  );

  // A base close to the page background (white on white, black on black) can't be a solid
  // color, so keep the scale's own step 9 in that case.
  const baseIndex = distance(base, scale[0]!) * 100 < 25 ? undefined : 8;
  if (baseIndex !== undefined) scale[8] = base;
  scale[9] = hoverColor(scale[8]!, scale);

  // Keep the text steps from being more saturated than the solid ones.
  const maxTextChroma = Math.max(scale[8]![1], scale[7]![1]);
  for (const i of [10, 11]) {
    scale[i]![1] = Math.min(maxTextChroma, scale[i]![1]);
  }

  return { steps: scale, baseIndex };
}
