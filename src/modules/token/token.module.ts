import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ConfigModule } from 'src/infrastructure/config';
import { DatabaseModule } from 'src/infrastructure/database';

import { RefreshTokenRepository } from './refreshToken.repository';
import { TokenService } from './token.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
    TokenService,
    RefreshTokenRepository,
  ],
  exports: [TokenService],
})
export class TokenModule {}
