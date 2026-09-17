export type BuiltInComponentsInput =
  | Record<string, Record<string, unknown> | undefined>
  | readonly string[];

export type OutputFile = { filename: string; content: string; writeMode?: "always" | "once" };
