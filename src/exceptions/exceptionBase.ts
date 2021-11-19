import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ExceptionResponse {
  @ApiProperty({ description: 'Код ответа' })
  code: number;

  @ApiProperty({ description: 'Человеческое описание ошибки' })
  message: string;
}

export abstract class Exception {
  abstract code: number;

  constructor(public readonly message: string, public readonly inner?: any) {}

  toString(): string {
    return 'Exception';
  }
}

export abstract class AuthenticationException extends Exception {
  public readonly code = HttpStatus.UNAUTHORIZED;
}

export abstract class NotAllowedException extends Exception {
  public readonly code = HttpStatus.FORBIDDEN;
}

export abstract class NotFoundException extends Exception {
  public readonly code = HttpStatus.NOT_FOUND;
}

export abstract class BadRequestException extends Exception {
  public readonly code = HttpStatus.BAD_REQUEST;
}

export abstract class ServerException extends Exception {
  public readonly code = HttpStatus.INTERNAL_SERVER_ERROR;
}
