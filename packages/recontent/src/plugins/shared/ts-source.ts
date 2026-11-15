import type { TokenLayer } from "../../token-model/model.js";
import type { TokenScaleMetadata } from "../../token-model/registry.js";
import { pathKey } from "../../token-model/guards.js";
import { propertyAccess, quotedKey } from "../../ts-source.js";
import type { GeneratorContext } from "./context.js";

export type ScaleExport = {
  metadata: TokenScaleMetadata;
  typeName: string;
  exportName: string;
};

export function entryPath(entry: { path: string[]; layer: TokenLayer }): string[] {
  return entry.layer === "components" ? entry.path : entry.path.slice(1);
}

function scaleNameSegments(scale: TokenScaleMetadata): string[] {
  return scale.path[0] === scale.layer ? scale.path : [scale.layer, ...scale.path];
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function capitalizeSegment(segment: string): string {
  return capitalize(segment.replace(/[^a-zA-Z0-9_$]/g, ""));
}

function scaleExportNames(scale: TokenScaleMetadata): {
  typeName: string;
  exportName: string;
} {
  const typeName = scaleNameSegments(scale).map(capitalizeSegment).join("");
  return {
    typeName,
    exportName: typeName.charAt(0).toLowerCase() + typeName.slice(1),
  };
}

export function scaleExportsForConfig(config: GeneratorContext): ScaleExport[] {
  const scales = new Map<string, TokenScaleMetadata>();
  for (const entry of config.registry.values()) {
    if (entry.scale) {
      scales.set(`${entry.scale.layer}:${pathKey(entry.scale.path)}`, entry.scale);
    }
  }
  return [...scales.values()].map((metadata) => ({
    metadata,
    ...scaleExportNames(metadata),
  }));
}

function scaleDocComment(scale: TokenScaleMetadata): string {
  const lines: string[] = [];
  if (scale.$description !== undefined) {
    lines.push(...scale.$description.split(/\r?\n/));
  }
  if (scale.$deprecated !== undefined && scale.$deprecated !== false) {
    lines.push(
      typeof scale.$deprecated === "string" ? `@deprecated ${scale.$deprecated}` : "@deprecated",
    );
  }
  if (lines.length === 0) {
    return "";
  }
  const body = lines.map((line) => ` * ${line.replace(/\*\//g, "*\\/")}`.trimEnd());
  return `/**\n${body.join("\n")}\n */\n`;
}

export function generateScaleExports(scale: ScaleExport, root = "vars"): string {
  const type = scale.metadata.keys.map(quotedKey).join(" | ");
  const doc = scaleDocComment(scale.metadata);
  return `${doc}export type ${scale.typeName} = ${type};\n\n${doc}export const ${scale.exportName} = ${propertyAccess(root, [scale.metadata.layer, ...entryPath({ path: scale.metadata.path, layer: scale.metadata.layer })])};`;
}
