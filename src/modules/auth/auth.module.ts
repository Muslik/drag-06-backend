import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SessionModule } from '@modules/session/session.module';
import { UsersModule } from '@modules/users';

import { AuthController } from './auth.controller';
import { AuthService, GoogleAuthService } from './services';

@Module({
  imports: [ConfigModule, UsersModule, SessionModule],
  providers: [GoogleAuthService, AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
