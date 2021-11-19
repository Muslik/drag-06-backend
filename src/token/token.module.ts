import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Config } from '@drag/config';

import { RefreshTokenEntity } from './entities';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([RefreshTokenEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => ({
        secret: configService.get('jwt.secret', { infer: true }),
        signOptions: {
          issuer: configService.get('jwt.issuer', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
