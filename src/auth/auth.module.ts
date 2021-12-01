import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SessionModule } from '@drag/session/session.module';
import { UsersModule } from '@drag/users';

import { AuthController } from './auth.controller';
import { AuthService, GoogleAuthService } from './services';

@Module({
  imports: [ConfigModule, UsersModule, SessionModule],
  providers: [GoogleAuthService, AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
