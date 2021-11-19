import { ValidationError } from 'class-validator';

import { BadRequestException } from './exceptionBase';

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
    super('Validation Failed!', errors.map(mapError));
  }
}
