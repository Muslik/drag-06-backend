import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TokenModule } from '@drag/token/token.module';
import { UsersModule } from '@drag/users';

import { AuthController } from './auth.controller';
import { AuthService, GoogleAuthService } from './services';

@Module({
  imports: [ConfigModule, UsersModule, TokenModule],
  providers: [GoogleAuthService, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
