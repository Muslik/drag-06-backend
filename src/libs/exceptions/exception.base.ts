export abstract class ExceptionBase<T extends string = string> {
  abstract type: string;

  constructor(
    public readonly code: T,
    public readonly message: string,
    public readonly inner?: unknown,
  ) {}

  toString(): string {
    return `[${this.code}]: ${this.message}`
  }
}
