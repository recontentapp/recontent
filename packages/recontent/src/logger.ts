import type { Logger, LogLevel } from "@recontentapp/core";

export type { Logger, LogLevel } from "@recontentapp/core";

export function createLogger(logLevel: LogLevel = "info"): Logger {
  return {
    info(message: string): void {
      console.error(message);
    },
    warn(message: string): void {
      console.error(`[recontent:warning] ${message}`);
    },
    error(message: string): void {
      console.error(`[recontent:error] ${message}`);
    },
    debug(message: string): void {
      if (logLevel === "debug") {
        console.error(`[recontent:debug] ${message}`);
      }
    },
  };
}
