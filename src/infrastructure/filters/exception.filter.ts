import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { EMPTY, throwError } from 'rxjs';

import { ExceptionBase, EXCEPTION_CODES } from 'src/infrastructure/exceptions';

const typesMap = new Map<string, number>()
  .set(EXCEPTION_CODES.UNAUTHORIZED, 401)
  .set(EXCEPTION_CODES.FORBIDDEN, 403)
  .set(EXCEPTION_CODES.NOT_FOUND, 404)
  .set(EXCEPTION_CODES.BAD_REQUEST, 400)
  .set(EXCEPTION_CODES.INTERNAL_SERVER_ERROR, 500);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: ExceptionBase, argumentsHost: ArgumentsHost) {
    const baseException = exception;

    this.logger.debug(baseException);

    if (argumentsHost.getType() === 'http') {
      const request = argumentsHost.switchToHttp().getResponse();
      const status = typesMap.get(baseException.type) || 500;
      request.status(status).send(baseException);

      return EMPTY;
    }

    return throwError(() => exception);
  }
}
