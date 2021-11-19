import { QueryFailedError } from 'typeorm';

import {
  AuthenticationException as AuthenticationExceptionBase,
  BadRequestException,
  ServerException,
} from './exceptionBase';

export { Exception, ExceptionResponse } from './exceptionBase';
export { ValidationException } from './validationException';

export class AuthenticationException extends AuthenticationExceptionBase {
  constructor() {
    super('Authentication failed');
  }
}

export class TokenException extends BadRequestException {
  constructor() {
    super('Bad token');
  }
}

export class QueryFailedException extends ServerException {
  constructor(error: QueryFailedError) {
    super(`Query failed. ${error.driverError}`);
  }
}
