import { ValidationError } from 'class-validator';
import { ExceptionBase } from './exception.base';
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
} from './exception.codes';

export class UnauthorizedException<T extends string= string> extends ExceptionBase<T> {
  public readonly type = UNAUTHORIZED;
}

export class NotAllowedException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = FORBIDDEN;
}

export class BadRequestException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = BAD_REQUEST;
}

export class NotFoundException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = NOT_FOUND;
}

export class InternalServerErrorException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = INTERNAL_SERVER_ERROR;
}

export class RequestValidationError {
  properties: string[];
  errors?: { [key: string]: string };
  nested?: RequestValidationError[];
}

const mapError = (error: ValidationError): RequestValidationError => ({
  properties: [error.property],
  errors: error.constraints,
  nested: error.children?.map(mapError),
});

export class ValidationException extends BadRequestException {
  constructor(errors: ValidationError[]) {
    super('VALIDATION_ERROR', 'Validation Failed!', errors.map(mapError));
  }
}

export class DatabaseError extends InternalServerErrorException {
  constructor(error: unknown) {
    super('DATABASE_ERROR', 'Database error', error)
  }
}
