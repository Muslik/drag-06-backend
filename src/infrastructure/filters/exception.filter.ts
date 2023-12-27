import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { I18nContext, I18nValidationError, I18nValidationException } from 'nestjs-i18n';
import { formatI18nErrors } from 'nestjs-i18n/dist/utils/util';
import { EMPTY, throwError } from 'rxjs';

import { I18nTranslations } from 'src/generated/i18n.generated';
import {
  ExceptionBase,
  EXCEPTION_CODES,
  RequestValidationError,
  BadRequestException,
} from 'src/infrastructure/exceptions';

const typesMap = new Map<string, number>()
  .set(EXCEPTION_CODES.UNAUTHORIZED, 401)
  .set(EXCEPTION_CODES.FORBIDDEN, 403)
  .set(EXCEPTION_CODES.NOT_FOUND, 404)
  .set(EXCEPTION_CODES.BAD_REQUEST, 400)
  .set(EXCEPTION_CODES.INTERNAL_SERVER_ERROR, 500);

const mapError = (error: I18nValidationError): RequestValidationError => ({
  property: error.property,
  errors: error.constraints ?? {},
  nested: error.children?.map(mapError) ?? [],
});

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: ExceptionBase, argumentsHost: ArgumentsHost) {
    const i18n = I18nContext.current<I18nTranslations>(argumentsHost);

    let baseException = exception;

    this.logger.debug(baseException);

    if (argumentsHost.getType() === 'http') {
      // По другому не сделать свой кастомный тип для I18 валидации.
      // Приходится даже импортить внутренний модуль formatI18nErrors
      if (baseException instanceof I18nValidationException && i18n) {
        const errors = formatI18nErrors(baseException.errors, i18n.service, {
          lang: i18n.lang,
        });

        // eslint-disable-next-line no-param-reassign
        const message =
          i18n.service.translate('translations.validationFailed', {
            lang: i18n.lang,
          }) || '';
        baseException = new BadRequestException('VALIDATION_ERROR', message, errors.map(mapError));
      }

      const request = argumentsHost.switchToHttp().getResponse();
      const status = typesMap.get(baseException.type) || 500;
      request.status(status).send(baseException);

      return EMPTY;
    }

    return throwError(() => exception);
  }
}
