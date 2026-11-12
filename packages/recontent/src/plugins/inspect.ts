import type { RecontentPlugin } from "@recontentapp/core";
import { createSnapshot } from "../snapshot.js";
import { outputPlugin } from "./factory.js";

export type InspectPluginOptions = {
  outDir: string;
  /** Defaults to `recontent.json`. */
  fileName?: string;
};

/**
 * Writes a snapshot of the tokens and, when `introspection` is configured, the
 * components and types. Point the package.json `recontent` field at it so that
 * apps depending on the design system can run `recontent inspect --from <package>`.
 */
export function inspect(options: InspectPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:inspect", ["tokens", "introspection?"], options, (ctx) => {
    const introspected =
      ctx.components && ctx.types ? { components: ctx.components, types: ctx.types } : undefined;
    return [
      {
        filename: options.fileName ?? "recontent.json",
        content: JSON.stringify(createSnapshot(ctx, introspected), null, 2),
      },
    ];
  });
}
