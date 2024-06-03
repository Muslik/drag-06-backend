export abstract class ExceptionBase<T extends string = string> {
  abstract type: string;
  abstract statusCode: number;

  constructor(
    public readonly code: T,
    public readonly message: string,
    public readonly inner?: unknown,
  ) {}

  toString(): string {
    return `[${this.code}]: ${this.message}`;
  }
}
