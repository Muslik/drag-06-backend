import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { I18nValidationException } from 'nestjs-i18n';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TypeORMError } from 'typeorm';

import { DatabaseError, ExceptionBase, InternalServerErrorException } from '@libs/exceptions';

export class UnexpectedException extends InternalServerErrorException {
  constructor(inner?: unknown) {
    super('UNEXPECTED_EXCEPTION', 'Unexpected error', inner);
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

          if (err instanceof TypeORMError) {
            return new DatabaseError(err);
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
