import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { MiddlewareConsumer, Module, Provider, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClsModule } from 'nestjs-cls';

import { BadRequestException } from 'src/infrastructure/exceptions';
import { GlobalExceptionFilter } from 'src/infrastructure/filters/exception.filter';
import { ExceptionInterceptor } from 'src/infrastructure/interceptors/exception.interceptor';
import { LoggerMiddleware } from 'src/infrastructure/middlewares/logger.middleware';

import { ConfigModule, ConfigService } from './infrastructure/config';
import { DatabaseModule, PrismaService } from './infrastructure/database';
import { AuthModule, AuthGuard } from './modules/auth';
import { SessionModule, SessionService } from './modules/session';
import { TokenModule, TokenService } from './modules/token';
import { TournamentModule } from './modules/tournament';
import { UsersModule, UserService } from './modules/user';

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
    useExisting: AuthGuard,
  },
  AuthGuard,
];

@Module({
  imports: [
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.jwt.secret,
        signOptions: {
          issuer: configService.jwt.issuer,
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule.forRootAsync({
      imports: [UsersModule, SessionModule, TokenModule],
      useFactory: async (userService: UserService, sessionService: SessionService, tokenService: TokenService) => ({
        tokenService,
        userService,
        sessionService,
      }),
      inject: [UserService, SessionService, TokenService],
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
