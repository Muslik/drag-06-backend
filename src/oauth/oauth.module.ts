import { Module } from '@nestjs/common';

import { AuthModule } from '@drag/auth/auth.module';
import { TokenModule } from '@drag/token/token.module';

import { OauthController } from './oauth.controller';

@Module({
  imports: [AuthModule, TokenModule],
  controllers: [OauthController],
})
export class OauthModule {}
