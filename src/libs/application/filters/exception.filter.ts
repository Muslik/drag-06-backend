import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import {
  BAD_REQUEST,
  ExceptionBase,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
} from "@libs/exceptions";
import { EMPTY, throwError } from "rxjs";

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
    this.logger.debug(exception);
    if (argumentsHost.getType() === "http") {
      const request = argumentsHost.switchToHttp().getResponse();
      const status = typesMap.get(exception.type) || 500;
      request.status(status).send(exception);

      return EMPTY;
    }

    return throwError(() => exception);
  }
}
