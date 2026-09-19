export class MissingDesignTokensError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.name = "MissingDesignTokensError";
    this.errors = errors;
  }
}
