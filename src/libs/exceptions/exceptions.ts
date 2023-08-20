import { ApiProperty } from '@nestjs/swagger';
import { I18nContext, I18nValidationError } from 'nestjs-i18n';

import { I18nTranslations } from '@src/generated/i18n.generated';

import { ExceptionBase } from './exception.base';
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED } from './exception.codes';

export class UnauthorizedException<T extends string = string> extends ExceptionBase<T> {
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

const mapError = (error: I18nValidationError): RequestValidationError => ({
  property: error.property,
  errors: error.constraints ?? {},
  nested: error.children?.map(mapError) ?? [],
});

export class ValidationException extends BadRequestException {
  constructor(errors: I18nValidationError[]) {
    const i18n = I18nContext.current<I18nTranslations>();
    const message =
      i18n?.service.translate('translations.validationFailed', {
        lang: i18n.lang,
      }) ?? '';
    super('VALIDATION_ERROR', message, errors.map(mapError));
  }
}

export class DatabaseError extends InternalServerErrorException {
  constructor(error: unknown) {
    super('DATABASE_ERROR', 'Database error', error);
  }
}
