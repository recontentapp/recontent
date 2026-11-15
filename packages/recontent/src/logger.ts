export type LogLevel = "info" | "debug";

export type Logger = {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
};

export function createLogger(logLevel: LogLevel = "info"): Logger {
  return {
    info(message: string): void {
      console.error(message);
    },
    warn(message: string): void {
      console.error(`warning: ${message}`);
    },
    error(message: string): void {
      console.error(`error: ${message}`);
    },
    debug(message: string): void {
      if (logLevel === "debug") {
        console.error(`debug: ${message}`);
      }
    },
  };
}
