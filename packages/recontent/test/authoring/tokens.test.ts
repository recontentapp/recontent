import { expect, test } from "@jest/globals";
import type { RawToken, StampedToken } from "../../src/token-model/model.js";
import type { ColorValue, ShadowLayer } from "../../src/token-model/values.js";
import { isTokenScale } from "../../src/token-model/guards.js";
import { toOklch } from "../../src/color/convert.js";
import { defineReferenceTokens, tokens } from "../../src/index.js";

const GRADIENT_STOPS = [
  { color: "#000000", position: 0 },
  { color: "#ffffff", position: 1 },
];

test.each<[string, () => unknown, RegExp | undefined]>([
  ["a hex color with non-hex characters", () => tokens.color("#zzzzzz"), /Invalid hex color/],
  ["a short hex color with non-hex characters", () => tokens.color("#zzz"), /Invalid hex color/],
  ["a color function with a missing channel", () => tokens.color("rgb(0 0)"), /Invalid CSS color/],
  ["an unknown color function", () => tokens.color("cmyk(0 0 0 0)"), /Invalid CSS color/],
  ["a named color", () => tokens.color("red"), /Invalid CSS color/],
  ["a NaN number", () => tokens.number(NaN), /Invalid number/],
  ["an infinite number", () => tokens.number(Infinity), /Invalid number/],
  ["a NaN fontWeight", () => tokens.fontWeight(NaN), /Invalid fontWeight/],
  [
    "a NaN alpha",
    () => tokens.color({ colorSpace: "srgb", components: [0, 0, 0], alpha: NaN }),
    /alpha/,
  ],
  [
    "an out-of-range alpha",
    () => tokens.color({ colorSpace: "srgb", components: [0, 0, 0], alpha: 2 }),
    /alpha/,
  ],
  [
    "a NaN component",
    () => tokens.color({ colorSpace: "srgb", components: [NaN, 0, 0] }),
    /Invalid component/,
  ],
  ["a non-finite cubicBezier", () => tokens.cubicBezier([0, NaN, 1, 1]), /Invalid cubicBezier/],
  [
    "a gradient angle that is not a CSS angle",
    () => tokens.gradient({ angle: "0deg); } body{display:none", stops: GRADIENT_STOPS }),
    /Invalid gradient angle/,
  ],
  ["a gradient with one stop", () => tokens.gradient({ stops: [GRADIENT_STOPS[0]!] }), undefined],
  ["a dimension with an unknown unit", () => tokens.dimension("1pt"), /Invalid dimension/],
  ["an unknown strokeStyle keyword", () => tokens.strokeStyle("squiggly" as never), undefined],
  [
    "an invalid strokeStyle lineCap",
    () => tokens.strokeStyle({ dashArray: ["4px"], lineCap: "bevel" as never }),
    undefined,
  ],
  [
    "a shadow without all layer members",
    () => tokens.shadow({ color: "#000000", offsetX: "0px", offsetY: "0px", blur: "0px" } as never),
    undefined,
  ],
  ["a border without a color", () => tokens.border({ width: "1px" } as never), undefined],
  [
    "a transition without a timingFunction",
    () => tokens.transition({ duration: "200ms" } as never),
    undefined,
  ],
  [
    "a typography without a fontWeight",
    () => tokens.typography({ fontFamily: "Arial", fontSize: "16px" } as never),
    undefined,
  ],
  [
    "a scale step the singular helper rejects",
    () => tokens.transitionScale({ bad: { duration: "100ms" } as never }),
    undefined,
  ],
  [
    "a color scale with too few steps",
    () => tokens.generateColorScale({ base: "#3e63dd", steps: [1, 2, 3] }),
    /exactly 12 steps/,
  ],
  [
    "a color scale with an unknown appearance",
    () => tokens.generateColorScale({ base: "#3e63dd", appearance: "sepia" as never }),
    /Invalid appearance/,
  ],
  [
    "an out-of-range alpha on .alpha()",
    () => tokens.color("#000000").alpha(1.5),
    /Invalid alpha: 1.5/,
  ],
  [
    "a translucent generateColorScale background",
    () => tokens.generateColorScale({ base: "#3e63dd", background: "#ffffff80" }),
    /opaque background/,
  ],
  [
    "a lineHeight dimension against an em fontSize",
    () =>
      tokens.typography({
        fontFamily: "Arial",
        fontSize: "1em",
        fontWeight: "regular",
        lineHeight: "24px",
      }),
    /cannot be converted against a fontSize in "em"/,
  ],
  [
    "a lineHeight that is not a dimension",
    () =>
      tokens.typography({
        fontFamily: "Arial",
        fontSize: "16px",
        fontWeight: "regular",
        lineHeight: "tall",
      }),
    /Invalid dimension/,
  ],
  [
    "a color scale with duplicate steps",
    () =>
      tokens.generateColorScale({
        base: "#3e63dd",
        steps: [1, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      }),
    /unique/,
  ],
])("rejects %s", (_name, build, message) => {
  expect(build).toThrow(message);
});

test.each(["A\nB", "A\rB", "Arial; } body{display:none} :root{--x:1", "A'B", "A(B)", "A/*B"])(
  "tokens.fontFamily rejects %j",
  (family) => {
    expect(() => tokens.fontFamily(family)).toThrow(/Invalid fontFamily/);
  },
);

test("tokens.fontFamily accepts quoted, spaced and non-ASCII family names", () => {
  expect(
    tokens.fontFamily(`"Helvetica Neue", Noto Sans JP, -apple-system, ヒラギノ`).$value,
  ).toEqual({
    value: ["Helvetica Neue", "Noto Sans JP", "-apple-system", "ヒラギノ"],
  });
});

test.each<[string, Partial<ColorValue>]>([
  [
    "rgb(255 128 0)",
    { colorSpace: "srgb", components: [1, 128 / 255, 0], alpha: 1, hex: "#ff8000" },
  ],
  ["rgba(0, 0, 0, 50%)", { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.5, hex: "#000000" }],
  ["hsl(210deg 50% 40% / 0.2)", { colorSpace: "hsl", components: [210, 50, 40], alpha: 0.2 }],
  ["oklch(70% 0.1 0.5turn)", { colorSpace: "oklch", components: [0.7, 0.1, 180], alpha: 1 }],
  ["OKLab(0.5 none -0.1)", { colorSpace: "oklab", components: [0.5, "none", -0.1], alpha: 1 }],
  [
    "color(display-p3 1 0 0)",
    { colorSpace: "display-p3", components: [1, 0, 0], alpha: 1, hex: "#ff0000" },
  ],
])("tokens.color parses the CSS color string %s", (input, expected) => {
  expect(tokens.color(input).$value).toMatchObject(expected);
});

test("alpha returns a plain translucent color without the metadata or alias", () => {
  const ref = defineReferenceTokens({
    ink: tokens.color("#09090b").describe("Ink").deprecate(),
  });
  const raw = tokens.color("#09090b").describe("Ink");

  for (const source of [raw, ref.ink]) {
    const faded = source.alpha(0.1);
    expect(faded._kind).toBe("raw");
    expect(faded.$value).toEqual({ ...source.$value, alpha: 0.1 });
    expect(faded.$description).toBeUndefined();
    expect(faded.$deprecated).toBeUndefined();
    expect(faded.alpha(0.5).$value.alpha).toBe(0.5);
  }
  expect(raw.$value.alpha).toBe(1);
});

test("tokens.gradient accepts CSS angles", () => {
  const stops = [
    { color: "#000000", position: 0 },
    { color: "#ffffff", position: 1 },
  ];
  expect(tokens.gradient({ angle: "0.25turn", stops }).$value.angle).toBe("0.25turn");
  expect(tokens.gradient({ angle: "-45deg", stops }).$value.angle).toBe("-45deg");
});

test("tokens.dimension accepts px, rem and em", () => {
  expect(tokens.dimension("16px").$value).toEqual({ value: 16, unit: "px" });
  expect(tokens.dimension("1.5rem").$value).toEqual({ value: 1.5, unit: "rem" });
  expect(tokens.dimension("-0.05em").$value).toEqual({ value: -0.05, unit: "em" });
});

test("tokens.strokeStyle accepts a keyword", () => {
  const token = tokens.strokeStyle("dashed");
  expect(token.$type).toBe("strokeStyle");
  expect(token.$value).toEqual({ style: "dashed" });
});

test("tokens.strokeStyle accepts a custom dash", () => {
  const token = tokens.strokeStyle({ dashArray: ["4px", "2px"], lineCap: "round" });
  expect(token.$value).toEqual({
    dashArray: [{ $value: { value: 4, unit: "px" } }, { $value: { value: 2, unit: "px" } }],
    lineCap: "round",
  });
});

test("tokens.shadow builds a single layer from raw input", () => {
  const token = tokens.shadow({
    color: "#000000",
    offsetX: "0px",
    offsetY: "2px",
    blur: "4px",
    spread: "0px",
  });
  expect(token.$type).toBe("shadow");
  expect(token.$value.layers.length).toBe(1);
  const layer = token.$value.layers[0] as ShadowLayer;
  expect(layer.color.alias).toBeUndefined();
  expect(layer.offsetY.$value).toEqual({ value: 2, unit: "px" });
});

test("tokens.shadow builds multiple layers and records member aliases", () => {
  const ref = defineReferenceTokens({ color: { black: tokens.color("#000000") } });
  const token = tokens.shadow([
    {
      color: ref.color.black,
      offsetX: "0px",
      offsetY: "1px",
      blur: "2px",
      spread: "0px",
      inset: true,
    },
    { color: "#111111", offsetX: "0px", offsetY: "4px", blur: "8px", spread: "0px" },
  ]);
  expect(token.$value.layers.length).toBe(2);
  const [layer0, layer1] = token.$value.layers as [ShadowLayer, ShadowLayer];
  expect(layer0.color.alias).toEqual(["ref", "color", "black"]);
  expect(layer0.inset).toBe(true);
  expect(layer1.inset).toBeUndefined();
});

test("tokens.border defaults style to solid", () => {
  const token = tokens.border({ color: "#000000", width: "1px" });
  expect(token.$value.style.$value).toEqual({ style: "solid" });
});

test("tokens.transition defaults delay to 0ms", () => {
  const token = tokens.transition({ duration: "200ms", timingFunction: [0.4, 0, 0.2, 1] });
  expect(token.$value.delay.$value).toEqual({ value: 0, unit: "ms" });
});

test("tokens.gradient clamps out-of-range stop positions", () => {
  const token = tokens.gradient({
    stops: [
      { color: "#000000", position: -0.1 },
      { color: "#ffffff", position: 1.5 },
    ],
  });
  const [first, second] = token.$value.stops as unknown as [
    { position: { $value: { value: number } } },
    { position: { $value: { value: number } } },
  ];
  expect(first.position.$value.value).toBe(0);
  expect(second.position.$value.value).toBe(1);
});

test("tokens.gradient defaults kind and angle", () => {
  const token = tokens.gradient({
    stops: [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 1 },
    ],
  });
  expect(token.$value.kind).toBe("linear");
  expect(token.$value.angle).toBe("180deg");
});

test("tokens.typography defaults letterSpacing and lineHeight", () => {
  const token = tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" });
  expect(token.$value.letterSpacing.$value).toEqual({ value: 0, unit: "px" });
  expect(token.$value.lineHeight.$value.value).toBe(1.4);
});

test.each<[string, string, string, number]>([
  ["the same unit", "16px", "24px", 1.5],
  ["rem against px", "16px", "2rem", 2],
  ["px against rem", "1rem", "20px", 1.25],
  ["em", "20px", "1.2em", 1.2],
  ["em against an em fontSize", "1.5em", "1.2em", 1.2],
  ["a rounded ratio", "24px", "29px", 1.2083],
])(
  "tokens.typography converts a lineHeight dimension: %s",
  (_name, fontSize, lineHeight, ratio) => {
    const token = tokens.typography({ fontFamily: "Arial", fontSize, fontWeight: 400, lineHeight });
    expect(token.$value.lineHeight).toEqual({ $value: { value: ratio } });
  },
);

test("tokens.typography converts a lineHeight dimension against an aliased fontSize", () => {
  const ref = defineReferenceTokens({ size: { body: tokens.dimension("20px") } });
  const token = tokens.typography({
    fontFamily: "Arial",
    fontSize: ref.size.body,
    fontWeight: 400,
    lineHeight: "30px",
  });
  expect(token.$value.lineHeight.$value.value).toBe(1.5);
});

test("tokens.typography accepts a stamped token and records its alias", () => {
  const ref = defineReferenceTokens({ fontFamily: { body: tokens.fontFamily("Arial") } });
  const token = tokens.typography({
    fontFamily: ref.fontFamily.body,
    fontSize: "16px",
    fontWeight: "regular",
  });
  expect(token.$value.fontFamily.alias).toEqual(["ref", "fontFamily", "body"]);
});

test("tokens.borderScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    border: { hairline: tokens.border({ color: "#000000", width: "1px" }) },
  });
  const raw = tokens.border({ color: "#111111", width: "2px" });
  const scale = tokens.borderScale({ hairline: ref.border.hairline, custom: raw });
  expect(scale.hairline).toBe(ref.border.hairline);
  expect(scale.custom).toBe(raw);
});

test.each([
  [
    "borderScale",
    () =>
      tokens.borderScale({
        thin: { color: "#000000", width: "1px" },
        thick: { color: "#000000", width: "4px" },
      }),
    "border",
    ["thin", "thick"],
    (scale: any) => scale.thin.$value.style.$value,
    { style: "solid" },
  ],
  [
    "fontFamilyScale",
    () => tokens.fontFamilyScale({ sans: "Inter, Arial", mono: "Menlo" }),
    "fontFamily",
    ["sans", "mono"],
    (scale: any) => scale.sans.$value,
    { value: ["Inter", "Arial"] },
  ],
  [
    "fontWeightScale",
    () => tokens.fontWeightScale({ regular: "regular", bold: 700 }),
    "fontWeight",
    ["regular", "bold"],
    (scale: any) => [scale.regular.$value, scale.bold.$value],
    [{ value: 400 }, { value: 700 }],
  ],
  [
    "cubicBezierScale",
    () => tokens.cubicBezierScale({ ease: [0.25, 0.1, 0.25, 1], linear: [0, 0, 1, 1] }),
    "cubicBezier",
    ["ease", "linear"],
    (scale: any) => scale.ease.$value,
    { value: [0.25, 0.1, 0.25, 1] },
  ],
  [
    "gradientScale",
    () => tokens.gradientScale({ fade: { stops: GRADIENT_STOPS } }),
    "gradient",
    ["fade"],
    (scale: any) => scale.fade.$value.kind,
    "linear",
  ],
  [
    "transitionScale",
    () =>
      tokens.transitionScale({
        fast: { duration: "100ms", timingFunction: [0.4, 0, 0.2, 1] },
        slow: { duration: "400ms", timingFunction: [0.4, 0, 0.2, 1] },
      }),
    "transition",
    ["fast", "slow"],
    (scale: any) => scale.fast.$value.delay.$value,
    { value: 0, unit: "ms" },
  ],
])(
  "tokens.%s builds a TokenScale with coerced steps",
  (_name, build, type, keys, probe, expected) => {
    const scale = build();
    expect(isTokenScale(scale)).toBe(true);
    expect((scale as { $type: string }).$type).toBe(type);
    expect(Object.keys(scale)).toEqual(keys);
    expect(probe(scale)).toEqual(expected);
  },
);

test("tokens.borderScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    border: { hairline: tokens.border({ color: "#000000", width: "1px" }) },
  });
  const raw = tokens.border({ color: "#111111", width: "2px" });
  const scale = tokens.borderScale({ hairline: ref.border.hairline, custom: raw });
  expect(scale.hairline).toBe(ref.border.hairline);
  expect(scale.custom).toBe(raw);
});

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function oklchOf(token: RawToken<"color"> | StampedToken<"color">): [number, number, number] {
  return toOklch(token.$value.colorSpace, token.$value.components);
}

function channels(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

test("tokens.generateColorScale returns a 12-step color scale keyed 1..12", () => {
  const scale = tokens.generateColorScale({ base: "#3e63dd" });
  expect(isTokenScale(scale)).toBe(true);
  expect(Object.keys(scale)).toEqual(STEPS.map(String));
  expect(scale[1].$type).toBe("color");
});

test("tokens.generateColorScale uses the base verbatim as step 9", () => {
  const scale = tokens.generateColorScale({ base: "#3e63dd" });
  expect(scale[9].$value.hex).toBe("#3e63dd");
  expect(scale[9].$value.colorSpace).toBe("srgb");
});

test("tokens.generateColorScale reproduces an indigo scale", () => {
  const indigo = [
    "#fdfdfe",
    "#f7f9ff",
    "#edf2fe",
    "#e1e9ff",
    "#d2deff",
    "#c1d0ff",
    "#abbdf9",
    "#8da4ef",
    "#3e63dd",
    "#3358d4",
    "#3a5bc7",
    "#1f2d5c",
  ];
  const scale = tokens.generateColorScale({ base: "#3e63dd" });
  STEPS.forEach((step, i) => {
    const tolerance = step === 10 ? 20 : 8;
    const actual = channels(scale[step].$value.hex!);
    const expected = channels(indigo[i]!);
    actual.forEach((value, c) =>
      expect(Math.abs(value - expected[c]!)).toBeLessThanOrEqual(tolerance),
    );
  });
});

test("tokens.generateColorScale light scales darken from background to text", () => {
  const lightness = STEPS.map(
    (step) => oklchOf(tokens.generateColorScale({ base: "#e5484d" })[step])[0],
  );
  for (let i = 1; i < lightness.length; i++) {
    expect(lightness[i]!).toBeLessThanOrEqual(lightness[i - 1]! + 1e-9);
  }
  expect(lightness[0]!).toBeGreaterThan(0.95);
  expect(lightness[11]!).toBeLessThan(0.35);
});

test("tokens.generateColorScale dark scales start on the background and end on light text", () => {
  const scale = tokens.generateColorScale({
    base: "#3e63dd",
    appearance: "dark",
  });
  const backgroundL = toOklch(
    "srgb",
    channels("#111111").map((v) => v / 255),
  )[0];
  expect(oklchOf(scale[1])[0]).toBeCloseTo(backgroundL, 2);
  expect(oklchOf(scale[12])[0]).toBeGreaterThan(0.85);
  expect(oklchOf(scale[8])[0]).toBeGreaterThan(oklchOf(scale[1])[0]);
});

test("tokens.generateColorScale step 1 follows the background", () => {
  const dark = tokens.generateColorScale({
    base: "#3e63dd",
    appearance: "dark",
    background: "#000000",
  });
  const gray = tokens.generateColorScale({
    base: "#3e63dd",
    appearance: "dark",
    background: "#333333",
  });
  expect(oklchOf(dark[1])[0]).toBeCloseTo(0, 2);
  expect(oklchOf(gray[1])[0]).toBeCloseTo(toOklch("srgb", [0.2, 0.2, 0.2])[0], 2);
  expect(gray[9].$value.hex).toBe("#3e63dd");
});

test("tokens.generateColorScale tints a neutral scale towards the base", () => {
  const scale = tokens.generateColorScale({ base: "#8b8d98", neutral: true });
  for (const step of STEPS) {
    expect(oklchOf(scale[step])[1]).toBeLessThan(0.04);
  }
  const [, , hue] = oklchOf(scale[6]);
  expect(
    Math.abs(
      hue -
        toOklch(
          "srgb",
          channels("#8b8d98").map((v) => v / 255),
        )[2],
    ),
  ).toBeLessThan(1);
});

test("tokens.generateColorScale builds a gray scale for a white or black base", () => {
  for (const base of ["#ffffff", "#000000"]) {
    const scale = tokens.generateColorScale({ base });
    for (const step of STEPS) {
      expect(oklchOf(scale[step])[1]).toBeLessThan(0.03);
    }
  }
});

test("tokens.generateColorScale does not use a base that is the page background as step 9", () => {
  const scale = tokens.generateColorScale({ base: "#fefefe" });
  expect(scale[9].$value.hex).not.toBe("#fefefe");
  expect(oklchOf(scale[9])[0]).toBeLessThan(0.8);
});

test("tokens.generateColorScale keeps generated steps inside sRGB for a wide-gamut base", () => {
  const scale = tokens.generateColorScale({
    base: { colorSpace: "oklch", components: [0.65, 0.3, 30] },
  });
  // The base itself is out of sRGB and stays verbatim; every other step must fit the gamut.
  expect(scale[9].$value.components).toEqual([0.65, 0.3, 30]);
  for (const step of STEPS.filter((step) => step !== 9)) {
    const [l, c] = scale[step].$value.components as number[];
    const [l2, c2] = toOklch(
      "srgb",
      channels(scale[step].$value.hex!).map((v) => v / 255),
    );
    expect(l2).toBeCloseTo(l!, 1);
    expect(c2).toBeCloseTo(c!, 1);
  }
});

test("tokens.generateColorScale accepts custom keys and a color token as base", () => {
  const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000] as const;
  const scale = tokens.generateColorScale({ base: tokens.color("#3e63dd"), steps: keys });
  expect(Object.keys(scale)).toEqual(keys.map(String));
  expect(scale[800].$value.hex).toBe("#3e63dd");
});
