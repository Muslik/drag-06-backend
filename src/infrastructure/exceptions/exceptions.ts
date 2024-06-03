import { ApiPropertyOptional } from '@nestjs/swagger';

import { ExceptionBase } from './exception.base';
import { EXCEPTION_CODES } from './exception.codes';

export class UnauthorizedException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.UNAUTHORIZED;
}

export class NotAllowedException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.FORBIDDEN;
}

export class BadRequestException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.BAD_REQUEST;
}

export class NotFoundException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.NOT_FOUND;
}

export class InternalServerErrorException<T extends string = string> extends ExceptionBase<T> {
  public readonly type = EXCEPTION_CODES.INTERNAL_SERVER_ERROR;
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
