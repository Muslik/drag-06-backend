import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RefreshTokenEntity } from './entities';
import { TokenService } from './token.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
    {
      provide: getRepositoryToken(RefreshTokenEntity),
      useClass: RefreshTokenEntity,
    },
    TokenService,
  ],
  exports: [TokenService],
})
export class TokenModule {}
