import type { Logger, LogLevel } from "@recontentapp/core";

export type { Logger, LogLevel } from "@recontentapp/core";

export function createLogger(logLevel: LogLevel = "info"): Logger {
  return {
    info(message: string): void {
      console.log(message);
    },
    warn(message: string): void {
      console.error(`[recontent:warning] ${message}`);
    },
    debug(message: string): void {
      if (logLevel === "debug") {
        console.error(`[recontent:debug] ${message}`);
      }
    },
  };
}
