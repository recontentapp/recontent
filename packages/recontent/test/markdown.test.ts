import { describe, expect, test } from "@jest/globals";
import { code } from "../src/markdown.js";

describe("code", () => {
  test("wraps text in a code span, escaping what would break a table cell", () => {
    expect(code("a | b")).toBe("`a \\| b`");
    expect(code("a\nb")).toBe("`a<br>b`");
  });

  test("keeps backticks, as in a template literal type, by lengthening the fence", () => {
    expect(code("`size-${number}`")).toBe("`` `size-${number}` ``");
    expect(code("a `` b")).toBe("``` a `` b ```");
  });
});
