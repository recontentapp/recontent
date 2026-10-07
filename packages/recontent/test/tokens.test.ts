import { expect, test } from "@jest/globals";
import type { RawToken, ShadowLayer, StampedToken } from "@recontentapp/core";
import { isTokenScale, toOklch } from "@recontentapp/core";
import { defineReferenceTokens, tokens } from "../src/index.js";

test("tokens.color rejects a hex string with non-hex characters", () => {
  expect(() => tokens.color("#zzzzzz")).toThrow(/Invalid hex color/);
});

test("tokens.color rejects a short hex string with non-hex characters", () => {
  expect(() => tokens.color("#zzz")).toThrow(/Invalid hex color/);
});

test("tokens.fontFamily rejects a family containing a newline", () => {
  expect(() => tokens.fontFamily("A\nB")).toThrow(/control characters/);
});

test("tokens.fontFamily rejects a family containing a carriage return", () => {
  expect(() => tokens.fontFamily("A\rB")).toThrow(/control characters/);
});

test("tokens.dimension accepts px, rem and em", () => {
  expect(tokens.dimension("16px").$value).toEqual({ value: 16, unit: "px" });
  expect(tokens.dimension("1.5rem").$value).toEqual({ value: 1.5, unit: "rem" });
  expect(tokens.dimension("-0.05em").$value).toEqual({ value: -0.05, unit: "em" });
});

test("tokens.dimension rejects unknown units", () => {
  expect(() => tokens.dimension("1pt")).toThrow(/Invalid dimension/);
});

test("tokens.strokeStyle accepts a keyword", () => {
  const token = tokens.strokeStyle("dashed");
  expect(token.$type).toBe("strokeStyle");
  expect(token.$value).toEqual({ style: "dashed" });
});

test("tokens.strokeStyle rejects an unknown keyword", () => {
  expect(() => tokens.strokeStyle("squiggly" as never)).toThrow();
});

test("tokens.strokeStyle accepts a custom dash", () => {
  const token = tokens.strokeStyle({ dashArray: ["4px", "2px"], lineCap: "round" });
  expect(token.$value).toEqual({
    dashArray: [
      { value: 4, unit: "px" },
      { value: 2, unit: "px" },
    ],
    lineCap: "round",
  });
});

test("tokens.strokeStyle rejects an invalid lineCap", () => {
  expect(() => tokens.strokeStyle({ dashArray: ["4px"], lineCap: "bevel" as never })).toThrow();
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

test("tokens.shadow requires all layer members", () => {
  expect(() =>
    tokens.shadow({ color: "#000000", offsetX: "0px", offsetY: "0px", blur: "0px" } as never),
  ).toThrow();
});

test("tokens.border defaults style to solid", () => {
  const token = tokens.border({ color: "#000000", width: "1px" });
  expect(token.$value.style.$value).toEqual({ style: "solid" });
});

test("tokens.border requires color and width", () => {
  expect(() => tokens.border({ width: "1px" } as never)).toThrow();
});

test("tokens.transition defaults delay to 0ms", () => {
  const token = tokens.transition({ duration: "200ms", timingFunction: [0.4, 0, 0.2, 1] });
  expect(token.$value.delay.$value).toEqual({ value: 0, unit: "ms" });
});

test("tokens.transition requires duration and timingFunction", () => {
  expect(() => tokens.transition({ duration: "200ms" } as never)).toThrow();
});

test("tokens.gradient requires at least 2 stops", () => {
  expect(() => tokens.gradient({ stops: [{ color: "#000000", position: 0 }] })).toThrow();
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

test("tokens.typography requires fontFamily, fontSize, and fontWeight", () => {
  expect(() => tokens.typography({ fontFamily: "Arial", fontSize: "16px" } as never)).toThrow();
});

test("tokens.typography defaults letterSpacing and lineHeight", () => {
  const token = tokens.typography({ fontFamily: "Arial", fontSize: "16px", fontWeight: "regular" });
  expect(token.$value.letterSpacing.$value).toEqual({ value: 0, unit: "px" });
  expect(token.$value.lineHeight.$value.value).toBe(1.4);
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

test("tokens.borderScale builds a TokenScale with coerced steps", () => {
  const scale = tokens.borderScale({
    thin: { color: "#000000", width: "1px" },
    thick: { color: "#000000", width: "4px" },
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("border");
  expect(Object.keys(scale)).toEqual(["thin", "thick"]);
  expect(scale.thin.$value.style.$value).toEqual({ style: "solid" });
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

test("tokens.borderScale still throws from the singular helper on invalid input", () => {
  expect(() => tokens.borderScale({ bad: { width: "1px" } as never })).toThrow();
});

test("tokens.cubicBezierScale builds a TokenScale with coerced steps", () => {
  const scale = tokens.cubicBezierScale({
    ease: [0.25, 0.1, 0.25, 1],
    linear: [0, 0, 1, 1],
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("cubicBezier");
  expect(Object.keys(scale)).toEqual(["ease", "linear"]);
  expect(scale.ease.$value).toEqual({ value: [0.25, 0.1, 0.25, 1] });
});

test("tokens.cubicBezierScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    cubicBezier: { ease: tokens.cubicBezier([0.25, 0.1, 0.25, 1]) },
  });
  const raw = tokens.cubicBezier([0, 0, 1, 1]);
  const scale = tokens.cubicBezierScale({ ease: ref.cubicBezier.ease, linear: raw });
  expect(scale.ease).toBe(ref.cubicBezier.ease);
  expect(scale.linear).toBe(raw);
});

test("tokens.gradientScale builds a TokenScale with coerced steps", () => {
  const scale = tokens.gradientScale({
    fade: {
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 1 },
      ],
    },
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("gradient");
  expect(Object.keys(scale)).toEqual(["fade"]);
  expect(scale.fade.$value.kind).toBe("linear");
});

test("tokens.gradientScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    gradient: {
      fade: tokens.gradient({
        stops: [
          { color: "#000000", position: 0 },
          { color: "#ffffff", position: 1 },
        ],
      }),
    },
  });
  const scale = tokens.gradientScale({ fade: ref.gradient.fade });
  expect(scale.fade).toBe(ref.gradient.fade);
});

test("tokens.gradientScale still throws from the singular helper on invalid input", () => {
  expect(() =>
    tokens.gradientScale({ bad: { stops: [{ color: "#000000", position: 0 }] } }),
  ).toThrow();
});

test("tokens.transitionScale builds a TokenScale with coerced steps and defaults delay to 0ms", () => {
  const scale = tokens.transitionScale({
    fast: { duration: "100ms", timingFunction: [0.4, 0, 0.2, 1] },
    slow: { duration: "400ms", timingFunction: [0.4, 0, 0.2, 1] },
  });
  expect(isTokenScale(scale)).toBe(true);
  expect(scale.$type).toBe("transition");
  expect(Object.keys(scale)).toEqual(["fast", "slow"]);
  expect(scale.fast.$value.delay.$value).toEqual({ value: 0, unit: "ms" });
});

test("tokens.transitionScale passes through raw/stamped tokens", () => {
  const ref = defineReferenceTokens({
    transition: {
      fast: tokens.transition({ duration: "100ms", timingFunction: [0.4, 0, 0.2, 1] }),
    },
  });
  const scale = tokens.transitionScale({ fast: ref.transition.fast });
  expect(scale.fast).toBe(ref.transition.fast);
});

test("tokens.transitionScale still throws from the singular helper on invalid input", () => {
  expect(() => tokens.transitionScale({ bad: { duration: "100ms" } as never })).toThrow();
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

test("tokens.generateColorScale reproduces the Radix indigo scale for Radix's indigo 9", () => {
  const radixIndigo = [
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
    // Step 10 is a derived hover color that Radix tunes by hand.
    const tolerance = step === 10 ? 20 : 8;
    const actual = channels(scale[step].$value.hex!);
    const expected = channels(radixIndigo[i]!);
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

test("tokens.generateColorScale rejects invalid input", () => {
  expect(() => tokens.generateColorScale({ base: "#3e63dd", steps: [1, 2, 3] })).toThrow(
    /exactly 12 steps/,
  );
  expect(() =>
    tokens.generateColorScale({ base: "#3e63dd", appearance: "sepia" as never }),
  ).toThrow(/Invalid appearance/);
  expect(() =>
    tokens.generateColorScale({ base: "#3e63dd", steps: [1, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }),
  ).toThrow(/unique/);
});
