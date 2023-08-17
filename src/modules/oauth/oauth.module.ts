import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { TokenModule } from '@modules/token/token.module';

import { OauthController } from './oauth.controller';

@Module({
  imports: [AuthModule, TokenModule],
  controllers: [OauthController],
})
export class OauthModule {}
