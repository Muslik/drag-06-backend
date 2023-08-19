import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { AuthModule } from '@modules/auth/auth.module';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { OauthModule } from '@modules/oauth/oauth.module';
import { SessionModule } from '@modules/session/session.module';
import { TokenModule } from '@modules/token/token.module';
import { UsersModule } from '@modules/users/users.module';

import { config, Config, configValidationScheme, NODE_ENV } from './config';
import { GlobalExceptionFilter } from './libs/application/filters/exception.filter';
import { ExceptionInterceptor } from './libs/application/interceptors/exception.interceptor';
import { LoggerMiddleware } from './libs/middlewares/logger.middleware';

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

const guards = [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
      envFilePath: NODE_ENV === 'production' ? '.env' : `.env.${NODE_ENV}`,
      validationSchema: configValidationScheme,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Config>) => {
        return {
          type: 'postgres',
          namingStrategy: new SnakeNamingStrategy(),
          host: configService.get('database.host', { infer: true }),
          port: configService.get('database.port', { infer: true }),
          username: configService.get('database.user', { infer: true }),
          password: configService.get('database.password', { infer: true }),
          database: configService.get('database.name', { infer: true }),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TokenModule,
    SessionModule,
    OauthModule,
  ],
  providers: [...interceptors, ...filters, ...guards],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
