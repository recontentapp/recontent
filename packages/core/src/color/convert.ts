// CSS Color 4 conversions to sRGB, adapted from the W3C sample conversion
// code (https://www.w3.org/TR/css-color-4/#color-conversion-code), which is
// public domain. Implemented locally to avoid a new dependency.

import type { ColorSpace, Component } from "./spaces.js";

type Vec3 = [number, number, number];

function none0(components: readonly Component[]): Vec3 {
  return [
    components[0] === "none" ? 0 : (components[0] as number),
    components[1] === "none" ? 0 : (components[1] as number),
    components[2] === "none" ? 0 : (components[2] as number),
  ];
}

function multiplyMatrix(A: readonly Vec3[], b: Vec3): Vec3 {
  return [
    A[0]![0] * b[0] + A[0]![1] * b[1] + A[0]![2] * b[2],
    A[1]![0] * b[0] + A[1]![1] * b[1] + A[1]![2] * b[2],
    A[2]![0] * b[0] + A[2]![1] * b[1] + A[2]![2] * b[2],
  ];
}

// --- sRGB <-> linear-light sRGB ---
function linSrgbChannel(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs <= 0.04045 ? val / 12.92 : sign * Math.pow((abs + 0.055) / 1.055, 2.4);
}
function gamSrgbChannel(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs > 0.0031308 ? sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) : 12.92 * val;
}
function linSrgb(rgb: Vec3): Vec3 {
  return rgb.map(linSrgbChannel) as Vec3;
}
function gamSrgb(rgb: Vec3): Vec3 {
  return rgb.map(gamSrgbChannel) as Vec3;
}

const LIN_SRGB_TO_XYZ: Vec3[] = [
  [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
  [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
  [0.01933081871559182, 0.11919477979462598, 0.9505321522496607],
];
const XYZ_TO_LIN_SRGB: Vec3[] = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];

// --- Display P3 ---
const LIN_P3_TO_XYZ: Vec3[] = [
  [0.4865709486482162, 0.26566769316909306, 0.19821728523436247],
  [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
  [0.0, 0.04511338185890264, 1.043944368900976],
];

// --- a98-rgb ---
function linA98Channel(val: number): number {
  const sign = val < 0 ? -1 : 1;
  return sign * Math.pow(Math.abs(val), 563 / 256);
}
const LIN_A98RGB_TO_XYZ: Vec3[] = [
  [0.5766690429101305, 0.1855582379065463, 0.1882286462349947],
  [0.29734497525053605, 0.6273635662554661, 0.07529145849399788],
  [0.02703136138641234, 0.07068885253582723, 0.9913375368376388],
];
// --- ProPhoto RGB (D50) ---
const PROPHOTO_ET2 = 16 / 512;
function linProPhotoChannel(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs <= PROPHOTO_ET2 ? val / 16 : sign * Math.pow(abs, 1.8);
}
const LIN_PROPHOTO_TO_XYZ_D50: Vec3[] = [
  [0.7977604896723027, 0.13518583717574031, 0.0313493495815248],
  [0.2880711282292934, 0.7118432178101014, 0.00008565396060525902],
  [0.0, 0.0, 0.8251046025104601],
];
// --- Rec2020 ---
const REC2020_ALPHA = 1.09929682680944;
const REC2020_BETA = 0.018053968510807;
function linRec2020Channel(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs < REC2020_BETA * 4.5
    ? val / 4.5
    : sign * Math.pow((abs + REC2020_ALPHA - 1) / REC2020_ALPHA, 1 / 0.45);
}
const LIN_2020_TO_XYZ: Vec3[] = [
  [0.6369580483012914, 0.14461690358620832, 0.168880975164172],
  [0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
  [0.0, 0.028072693049087428, 1.060985057710791],
];

const D50_TO_D65: Vec3[] = [
  [0.9554734527042182, -0.0230985368294622, 0.0632593086610217],
  [-0.0283697093338637, 1.0099953980813041, 0.0210715771796609],
  [0.0123140016883199, -0.0205019519333514, 1.3300365726973367],
];

// --- Lab / LCH (D50) ---
const LAB_WHITE: Vec3 = [0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585];
const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;

function labToXyz(lab: Vec3): Vec3 {
  const f1 = (lab[0] + 16) / 116;
  const f0 = lab[1] / 500 + f1;
  const f2 = f1 - lab[2] / 200;
  const x = Math.pow(f0, 3) > LAB_EPSILON ? Math.pow(f0, 3) : (116 * f0 - 16) / LAB_KAPPA;
  const y =
    lab[0] > LAB_KAPPA * LAB_EPSILON ? Math.pow((lab[0] + 16) / 116, 3) : lab[0] / LAB_KAPPA;
  const z = Math.pow(f2, 3) > LAB_EPSILON ? Math.pow(f2, 3) : (116 * f2 - 16) / LAB_KAPPA;
  return [x * LAB_WHITE[0], y * LAB_WHITE[1], z * LAB_WHITE[2]];
}

function lchToLab(lch: Vec3): Vec3 {
  return [
    lch[0],
    lch[1] * Math.cos((lch[2] * Math.PI) / 180),
    lch[1] * Math.sin((lch[2] * Math.PI) / 180),
  ];
}

// --- OKLab / OKLCH (via D65 XYZ) ---
const LMS_TO_XYZ: Vec3[] = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];

const XYZ_TO_LMS: Vec3[] = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];

const LMS_TO_OKLAB: Vec3[] = [
  [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
  [1.9779985324311684, -2.42859224204858, 0.450593709617411],
  [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];

const OKLAB_TO_LMS: Vec3[] = [
  [1.0, 0.3963377773761749, 0.2158037573099136],
  [1.0, -0.1055613458156586, -0.0638541728258133],
  [1.0, -0.0894841775298119, -1.2914855480194092],
];

function oklabToXyz(oklab: Vec3): Vec3 {
  const lms = multiplyMatrix(OKLAB_TO_LMS, oklab).map((v) => v ** 3) as Vec3;
  return multiplyMatrix(LMS_TO_XYZ, lms);
}

function oklchToOklab(oklch: Vec3): Vec3 {
  return [
    oklch[0],
    oklch[1] * Math.cos((oklch[2] * Math.PI) / 180),
    oklch[1] * Math.sin((oklch[2] * Math.PI) / 180),
  ];
}

// --- HSL / HWB (sRGB gamut) ---
function hslToSrgb(hsl: Vec3): Vec3 {
  const h = ((hsl[0] % 360) + 360) % 360;
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;
  const f = (n: number): number => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}
function hwbToSrgb(hwb: Vec3): Vec3 {
  const h = hwb[0];
  const w = hwb[1] / 100;
  const blk = hwb[2] / 100;
  if (w + blk >= 1) {
    const gray = w / (w + blk);
    return [gray, gray, gray];
  }
  const rgb = hslToSrgb([h, 100, 50]);
  return rgb.map((v) => v * (1 - w - blk) + w) as Vec3;
}

function toXyzD65(colorSpace: ColorSpace, components: Vec3): Vec3 {
  switch (colorSpace) {
    case "srgb":
      return multiplyMatrix(LIN_SRGB_TO_XYZ, linSrgb(components));
    case "srgb-linear":
      return multiplyMatrix(LIN_SRGB_TO_XYZ, components);
    case "hsl":
      return multiplyMatrix(LIN_SRGB_TO_XYZ, linSrgb(hslToSrgb(components)));
    case "hwb":
      return multiplyMatrix(LIN_SRGB_TO_XYZ, linSrgb(hwbToSrgb(components)));
    case "display-p3":
      return multiplyMatrix(LIN_P3_TO_XYZ, linSrgb(components));
    case "a98-rgb":
      return multiplyMatrix(LIN_A98RGB_TO_XYZ, components.map(linA98Channel) as Vec3);
    case "rec2020":
      return multiplyMatrix(LIN_2020_TO_XYZ, components.map(linRec2020Channel) as Vec3);
    case "prophoto-rgb":
      return multiplyMatrix(
        D50_TO_D65,
        multiplyMatrix(LIN_PROPHOTO_TO_XYZ_D50, components.map(linProPhotoChannel) as Vec3),
      );
    case "lab":
      return multiplyMatrix(D50_TO_D65, labToXyz(components));
    case "lch":
      return multiplyMatrix(D50_TO_D65, labToXyz(lchToLab(components)));
    case "oklab":
      return oklabToXyz(components);
    case "oklch":
      return oklabToXyz(oklchToOklab(components));
    case "xyz-d65":
      return components;
    case "xyz-d50":
      return multiplyMatrix(D50_TO_D65, components);
    default:
      throw new Error(`Unknown color space: ${colorSpace satisfies never}`);
  }
}

function xyzD65ToSrgb(xyz: Vec3): Vec3 {
  return gamSrgb(multiplyMatrix(XYZ_TO_LIN_SRGB, xyz));
}

function clamp01(rgb: Vec3): Vec3 {
  return rgb.map((v) => Math.min(1, Math.max(0, v))) as Vec3;
}

export function toSrgbRgb(colorSpace: ColorSpace, components: readonly Component[]): Vec3 {
  const resolved = none0(components);
  const xyz = toXyzD65(colorSpace, resolved);
  return clamp01(xyzD65ToSrgb(xyz));
}

export function toSrgbHex(colorSpace: ColorSpace, components: readonly Component[]): string {
  const [r, g, b] = toSrgbRgb(colorSpace, components);
  const toByte = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

/** Converts a color in any supported space to OKLCH: [L 0..1, C >= 0, h 0..360). */
export function toOklch(colorSpace: ColorSpace, components: readonly Component[]): Vec3 {
  const xyz = toXyzD65(colorSpace, none0(components));
  const lms = multiplyMatrix(XYZ_TO_LMS, xyz).map(Math.cbrt) as Vec3;
  const [l, a, b] = multiplyMatrix(LMS_TO_OKLAB, lms);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return [l, Math.hypot(a, b), (hue + 360) % 360];
}

const GAMUT_EPSILON = 1e-4;

function oklchInSrgbGamut(oklch: Vec3): boolean {
  const rgb = xyzD65ToSrgb(oklabToXyz(oklchToOklab(oklch)));
  return rgb.every((v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON);
}

/**
 * Returns the OKLCH color with the same lightness and hue as `oklch` and the highest chroma
 * that still fits in sRGB (at most the input chroma). Unlike clamping channels, this keeps
 * the perceived lightness and hue of the color.
 */
export function fitOklchToSrgb(oklch: Vec3): Vec3 {
  const [l, c, h] = oklch;
  if (l <= 0 || l >= 1) return [Math.min(1, Math.max(0, l)), 0, h];
  if (oklchInSrgbGamut(oklch)) return oklch;

  let lo = 0;
  let hi = c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (oklchInSrgbGamut([l, mid, h])) lo = mid;
    else hi = mid;
  }
  return [l, lo, h];
}
