import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { MiddlewareConsumer, Module, Provider } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClsModule } from 'nestjs-cls';
import { HeaderResolver, I18nModule, I18nValidationPipe, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';

import { GlobalExceptionFilter } from 'src/infrastructure/filters/exception.filter';
import { ExceptionInterceptor } from 'src/infrastructure/interceptors/exception.interceptor';
import { LoggerMiddleware } from 'src/infrastructure/middlewares/logger.middleware';

import { ConfigModule, ConfigService } from './infrastructure/config';
import { DatabaseModule, PrismaService } from './infrastructure/database';
import { AuthModule, AuthGuard } from './modules/auth';
import { SessionModule, SessionService } from './modules/session';
import { TokenModule, TokenService } from './modules/token';
import { UsersModule, UserService } from './modules/user';

const pipes = [
  {
    provide: APP_PIPE,
    useClass: I18nValidationPipe,
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
    I18nModule.forRoot({
      fallbackLanguage: 'ru',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: false,
      },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, new HeaderResolver(['x-lang'])],
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
  ],
  providers: [...interceptors, ...filters, ...guards, ...pipes],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
