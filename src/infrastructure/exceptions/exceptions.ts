import { ApiProperty } from '@nestjs/swagger';

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

// TODO: Доработать nested чтобы там был такой же тип RequestValidationError
// Сейчас circular deps error
export class RequestValidationError {
  @ApiProperty({ description: 'Поле у которого возникла ошибка', example: 'email' })
  property: string;

  @ApiProperty({
    description: 'Описание каждой ошибки',
    example: {
      isNotEmpty: 'Поле не может быть пустым',
    },
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  })
  errors: { [key: string]: string };

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
    },
  })
  nested: RequestValidationError[];
}
