import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshTokenEntity } from './entities';
import { TokenService } from './token.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([RefreshTokenEntity])],
  providers: [
    {
      provide: JwtService,
      useClass: JwtService,
    },
    TokenService,
  ],
  exports: [TokenService],
})
export class TokenModule {}
