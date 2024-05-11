import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { I18nTranslations } from 'src/i18n';
import { ExceptionBase, InternalServerErrorException } from 'src/infrastructure/exceptions';

export class UnexpectedException extends InternalServerErrorException {
  constructor(inner?: unknown) {
    const i18n = I18nContext.current<I18nTranslations>();
    let currentInner = inner;
    const message = i18n?.translate('translations.error.unexpected') ?? '';

    if (process.env.NODE_ENV !== 'development') {
      currentInner = undefined;
    }

    super('UNEXPECTED_EXCEPTION', message, currentInner);
  }
}

export class ExceptionInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger('Interceptor');

  intercept(_context: ExecutionContext, next: CallHandler): Observable<ExceptionBase> {
    return next.handle().pipe(
      catchError((err) => {
        return throwError(() => {
          this.logger.debug(`[INTERCEPT]: `, err);
          if (err instanceof ExceptionBase) {
            return err;
          }

          if (err instanceof I18nValidationException) {
            return err;
          }

          return new UnexpectedException(err);
        });
      }),
      // На случай если controller вернет ошибку вместо того чтобы ее бросить
      map((data) => {
        if (data instanceof ExceptionBase) {
          throw data;
        }

        return data;
      }),
    );
  }
}
