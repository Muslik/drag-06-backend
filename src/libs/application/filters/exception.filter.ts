import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { formatI18nErrors } from 'nestjs-i18n/dist/utils/util';
import { EMPTY, throwError } from 'rxjs';

import { I18nTranslations } from '@src/generated/i18n.generated';

import {
  BAD_REQUEST,
  ExceptionBase,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
  ValidationException,
} from '@libs/exceptions';

const typesMap = new Map<string, number>()
  .set(UNAUTHORIZED, 401)
  .set(FORBIDDEN, 403)
  .set(NOT_FOUND, 404)
  .set(BAD_REQUEST, 400)
  .set(INTERNAL_SERVER_ERROR, 500);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: ExceptionBase, argumentsHost: ArgumentsHost) {
    const i18n = I18nContext.current<I18nTranslations>(argumentsHost);

    this.logger.debug(exception);

    if (argumentsHost.getType() === 'http') {
      // По другому не сделать свой кастомный тип для I18 валидации.
      // Приходится даже импортить внутренний модуль formatI18nErrors
      if (exception instanceof I18nValidationException && i18n) {
        const errors = formatI18nErrors(exception.errors, i18n.service, {
          lang: i18n.lang,
        });

        // eslint-disable-next-line no-param-reassign
        exception = new ValidationException(errors);
      }

      const request = argumentsHost.switchToHttp().getResponse();
      const status = typesMap.get(exception.type) || 500;
      request.status(status).send(exception);

      return EMPTY;
    }

    return throwError(() => exception);
  }
}
