import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

import { ExceptionBase, InternalServerErrorException } from "@libs/exceptions";

export class UnexpectedException extends InternalServerErrorException {
  constructor(inner?: unknown) {
    super("UNEXPECTED_EXCEPTION", "Неизвестная ошибка", inner);
  }
}

export class ExceptionInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<ExceptionBase> {
    return next.handle().pipe(
      catchError((err) => {
        return throwError(() => {
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
      })
    );
  }
}
