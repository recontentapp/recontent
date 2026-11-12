import { defineConfig, defineReferenceTokens, defineSystemTokens, tokens } from "recontent";
import { resolveValue, type RecontentPlugin } from "recontent/plugins";

// Writes every color token as JSON, and warns about system tokens without a description.
function colorList(options: { outDir: string }): RecontentPlugin {
  return {
    name: "acme:color-list",
    dependsOn: ["tokens"],

    validate({ registry }) {
      return [...registry.values()]
        .filter((entry) => entry.layer === "system" && !entry.$description)
        .map((entry) => ({
          severity: "warning" as const,
          message: `${entry.path.join(".")} has no description.`,
          path: entry.path,
        }));
    },

    generate(ctx) {
      const colors: Record<string, string> = {};
      for (const [key, entry] of ctx.registry) {
        if (entry.$type !== "color") continue;
        const value = resolveValue(ctx, entry);
        if ("hex" in value) colors[key] = value.hex;
      }
      return [
        {
          path: `${options.outDir}/colors.json`,
          content: `${JSON.stringify(colors, null, 2)}\n`,
        },
      ];
    },
  };
}

const ref = defineReferenceTokens({
  color: { blue: tokens.color("#2563eb") },
});

const system = defineSystemTokens({
  color: { accent: ref.color.blue.describe("Primary action color") },
});

export default defineConfig({
  tokens: { ref, system },
  plugins: [colorList({ outDir: "src/generated" })],
});
