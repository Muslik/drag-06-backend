import { ApiPropertyOptional } from '@nestjs/swagger';

import { ExceptionBase } from './exception.base';
import { EXCEPTION_CODES } from './exception.codes';

export class UnauthorizedException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.UNAUTHORIZED;
  public readonly statusCode = 401;
}

export class NotAllowedException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.FORBIDDEN;
  public readonly statusCode = 403;
}

export class BadRequestException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.BAD_REQUEST;
  public readonly statusCode = 400;
}

export class NotFoundException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.NOT_FOUND;
  public readonly statusCode = 404;
}

export class InternalServerErrorException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.INTERNAL_SERVER_ERROR;
  public readonly statusCode = 500;
}

export class RateLimitException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.TOO_MANY_REQUESTS;
  public readonly statusCode = 429;
}

/** Contains all fields from class-validator */
export class RequestValidationErrorDto {
  @ApiPropertyOptional()
  isString?: string;

  @ApiPropertyOptional()
  isNumberString?: string;

  @ApiPropertyOptional()
  isEmail?: string;

  @ApiPropertyOptional()
  isNumber?: string;

  @ApiPropertyOptional()
  isEnum?: string;

  @ApiPropertyOptional()
  isNotEmpty?: string;

  @ApiPropertyOptional()
  isArray?: string;

  @ApiPropertyOptional()
  isIn?: string;

  @ApiPropertyOptional()
  isDate?: string;

  @ApiPropertyOptional()
  isDateString?: string;

  @ApiPropertyOptional()
  arrayMaxSize?: string;

  @ApiPropertyOptional()
  arrayMinSize?: string;

  @ApiPropertyOptional()
  arrayUnique?: string;

  @ApiPropertyOptional()
  arrayNotEmpty?: string;
}
