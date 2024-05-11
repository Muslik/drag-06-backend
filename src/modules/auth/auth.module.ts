import { DynamicModule, Module } from '@nestjs/common';

import { ConfigModule } from 'src/infrastructure/config';

import {
  AUTH_JWT_SERVICE,
  AUTH_SERVICE,
  AUTH_SERVICE_OPTIONS,
  AUTH_SESSION_SERVICE,
  AUTH_GOOGLE_SERVICE,
} from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthModuleAsyncOptions } from './interfaces/authServiceOptions';
import { AuthService } from './services/auth/auth.service';
import {
  AuthGoogleService,
  GoogleAuthClientProvider,
  GOOGLE_AUTH_CLIENT_PROVIDER,
} from './services/authGoogle/authGoogle.service';
import { AuthJwtService } from './services/authJwt/authJwt.service';
import { AuthSessionService } from './services/authSession/authSession.service';

@Module({
  imports: [ConfigModule],
})
export class AuthModule {
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      controllers: [AuthController],
      imports: options.imports,
      providers: [
        {
          provide: AUTH_SERVICE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: AUTH_GOOGLE_SERVICE,
          useClass: AuthGoogleService,
        },
        {
          provide: AUTH_SERVICE,
          useClass: AuthService,
        },
        {
          provide: AUTH_SESSION_SERVICE,
          useClass: AuthSessionService,
        },
        {
          provide: AUTH_JWT_SERVICE,
          useClass: AuthJwtService,
        },
        {
          provide: GOOGLE_AUTH_CLIENT_PROVIDER,
          useClass: GoogleAuthClientProvider,
        },
      ],
    };
  }
}
