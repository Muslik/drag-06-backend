import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { MiddlewareConsumer, Module, Provider, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';

import { BadRequestException } from 'src/infrastructure/exceptions';
import { GlobalExceptionFilter } from 'src/infrastructure/filters/exception.filter';
import { ExceptionInterceptor } from 'src/infrastructure/interceptors/exception.interceptor';
import { LoggerMiddleware } from 'src/infrastructure/middlewares/logger.middleware';

import { ConfigModule } from './infrastructure/config';
import { DatabaseModule, PrismaService } from './infrastructure/database';
import { RateLimitGuard } from './infrastructure/guards/rateLimit.guard';
import { AuthModule, AuthGuard, RolesGuard } from './modules/auth';
import { ISessionService, SESSION_SERVICE, SessionModule } from './modules/session';
import { ITokenService, TOKEN_SERVICE, TokenModule } from './modules/token';
import { TournamentModule } from './modules/tournament';
import { UsersModule, IUserService, USERS_SERVICE } from './modules/user';

const pipes = [
  {
    provide: APP_PIPE,
    useFactory: () =>
      new ValidationPipe({
        exceptionFactory: (errors) =>
          new BadRequestException(
            'VALIDATION_ERROR',
            'Ошибка валидации данных',
            Object.fromEntries(
              errors.map((error): [string, Record<string, string>] => [error.property, error.constraints || {}]),
            ),
          ),
      }),
  },
];

const interceptors = [
  {
    provide: APP_INTERCEPTOR,
    useClass: ExceptionInterceptor,
  },
];

const filters = [
  {
    provide: APP_FILTER,
    useClass: GlobalExceptionFilter,
  },
];

const guards: Provider[] = [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RateLimitGuard,
  },
];

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10000,
      },
    ]),
    ConfigModule.forRoot(),
    DatabaseModule,
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [DatabaseModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
          }),
        }),
      ],
    }),
    AuthModule.forRootAsync({
      imports: [UsersModule, SessionModule, TokenModule],
      useFactory: async (userService: IUserService, sessionService: ISessionService, tokenService: ITokenService) => ({
        tokenService,
        userService,
        sessionService,
      }),
      inject: [USERS_SERVICE, SESSION_SERVICE, TOKEN_SERVICE],
    }),
    UsersModule,
    TokenModule,
    SessionModule,
    TournamentModule,
  ],
  providers: [...interceptors, ...filters, ...guards, ...pipes],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
