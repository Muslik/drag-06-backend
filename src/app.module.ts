import { MiddlewareConsumer, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule, I18nValidationPipe, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { GlobalExceptionFilter } from 'src/infrastructure/filters/exception.filter';
import { ExceptionInterceptor } from 'src/infrastructure/interceptors/exception.interceptor';
import { LoggerMiddleware } from 'src/infrastructure/middlewares/logger.middleware';

import { config, Config, configValidationScheme, NODE_ENV } from './config';
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => ({
        secret: configService.get('jwt.secret', { infer: true }),
        signOptions: {
          issuer: configService.get('jwt.issuer', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      typesOutputPath: path.join(__dirname, '/generated/i18n.generated.ts'),
      resolvers: [{ use: QueryResolver, options: ['lang'] }, new HeaderResolver(['x-lang'])],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config>) => ({
        type: 'postgres',
        namingStrategy: new SnakeNamingStrategy(),
        host: configService.get('database.host', { infer: true }),
        port: configService.get('database.port', { infer: true }),
        username: configService.get('database.user', { infer: true }),
        password: configService.get('database.password', { infer: true }),
        database: configService.get('database.name', { infer: true }),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        dropSchema: false,
        synchronize: true,
      }),
    }),
    ConfigModule.forRoot({
      load: [config],
      isGlobal: false,
      envFilePath: NODE_ENV === 'production' ? '.env' : `.env.${NODE_ENV}`,
      validationSchema: configValidationScheme,
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
