export type LogLevel = "info" | "debug";
export type Logger = {
  info(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
};
