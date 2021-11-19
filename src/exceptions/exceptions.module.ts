import {
  ArgumentsHost,
  CallHandler,
  Catch,
  DynamicModule,
  ExceptionFilter,
  ExecutionContext,
  Injectable,
  Module,
  NestInterceptor,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { FastifyReply } from 'fastify';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { catchError, EMPTY, Observable } from 'rxjs';
import { QueryFailedError } from 'typeorm';

import { COOKIE_PATH, REFRESH_TOKEN_COOKIE_NAME } from '@drag/auth/constants';
import { Exception, AuthenticationException, QueryFailedException } from '@drag/exceptions';

@Module({})
export class ExceptionsModule {
  public static forRoot(): DynamicModule {
    return {
      module: ExceptionsModule,
      providers: [
        {
          provide: APP_FILTER,
          useClass: GlobalExceptionsFilter,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: ExceptionsInterceptor,
        },
      ],
    };
  }
}

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception: Exception, argumentsHost: ArgumentsHost): Observable<any> {
    const response = argumentsHost.switchToHttp().getResponse<FastifyReply>();
    const status = exception.code || 500;
    response.status(status).send(exception);
    return EMPTY;
  }
}

const isJwtException = (exception: any) =>
  exception instanceof JsonWebTokenError ||
  exception instanceof TokenExpiredError ||
  exception instanceof NotBeforeError;

@Injectable()
export class ExceptionsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<FastifyReply>();
    return next
      .handle()
      .pipe(
        catchError((error) => {
          if (error instanceof QueryFailedError) {
            throw new QueryFailedException(error);
          } else if (isJwtException(error)) {
            throw new AuthenticationException();
          }
          throw error;
        }),
      )
      .pipe(
        catchError((error) => {
          if (error instanceof AuthenticationException) {
            response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: COOKIE_PATH });
          }
          throw error;
        }),
      );
  }
}
