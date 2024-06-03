import { CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { EXCEPTION_CODES, ExceptionBase, InternalServerErrorException } from 'src/infrastructure/exceptions';

export class UnexpectedException extends InternalServerErrorException {
  constructor(inner?: unknown) {
    let currentInner = inner;

    if (process.env.NODE_ENV !== 'development') {
      currentInner = undefined;
    }

    super(`${EXCEPTION_CODES.INTERNAL_SERVER_ERROR}.UNEXPECTED_EXCEPTION`, 'Internal server error', currentInner);
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
