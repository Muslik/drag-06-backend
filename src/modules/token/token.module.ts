import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from 'src/infrastructure/config';
import { DatabaseModule } from 'src/infrastructure/database';

import { RefreshTokenRepository } from './refreshToken.repository';
import { TOKEN_SERVICE } from './token.constants';
import { TokenService } from './token.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.jwt.secret,
        signOptions: {
          issuer: configService.jwt.issuer,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: TOKEN_SERVICE,
      useClass: TokenService,
    },
    RefreshTokenRepository,
  ],
  exports: [TOKEN_SERVICE],
})
export class TokenModule {}
