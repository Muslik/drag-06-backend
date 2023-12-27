import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Either, left, right } from '@sweet-monads/either';
import { from, Maybe, none, fromNullable } from '@sweet-monads/maybe';
import { Equal, DataSource, Repository } from 'typeorm';
import { v1 as uuid } from 'uuid';

import { Config } from 'src/config';
import { UserIdentity } from 'src/infrastructure/decorators';

import { JWTTokensDto } from './dto/jwtTokens.dto';
import { RefreshTokenEntity } from './entities';
import { JWTPayload } from './interfaces';
import { ITokenService } from './interfaces/token.service.interface';
import { RefreshTokenInvalidError } from './token.errors';

@Injectable()
export class TokenService implements ITokenService {
  private readonly accessTokenTtl: number;
  private readonly refreshTokenTtl: number;
  constructor(
    private dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Config>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {
    this.accessTokenTtl = this.configService.get<number>('jwt.accessTokenTtl', {
      infer: true,
    });
    this.refreshTokenTtl = this.configService.get<number>('jwt.refreshTokenTtl', { infer: true });
  }

  private createTokensByUserID(userId: string): JWTTokensDto {
    const random = Math.random();
    const payload = { userId, random };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessTokenTtl,
      jwtid: uuid(),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenTtl,
      jwtid: uuid(),
    });

    return { accessToken, refreshToken };
  }

  private async refreshUserTokens(currentToken: RefreshTokenEntity, userIdentity: UserIdentity): Promise<JWTTokensDto> {
    return this.dataSource.transaction(async (transactionEntityManager) => {
      transactionEntityManager.remove(currentToken);

      return this.getUserTokens(currentToken.userAccountId, userIdentity);
    });
  }

  private async saveUserToken(userId: string, refreshToken: string, expires: number, { userAgent, ip }: UserIdentity) {
    const newRefreshToken = this.refreshTokenRepository.create({
      refreshToken,
      userAgent,
      ip,
      userAccountId: userId,
      expires,
    });
    await this.refreshTokenRepository.save(newRefreshToken);
  }

  private async getCurrentRefreshToken(refreshToken: string): Promise<Maybe<RefreshTokenEntity>> {
    return fromNullable(await this.refreshTokenRepository.findOne({ where: { refreshToken: Equal(refreshToken) } }));
  }

  verifyToken(token: string): Maybe<JWTPayload> {
    try {
      const data = this.jwtService.verify<JWTPayload>(token);

      return from(data);
    } catch (error) {
      return none();
    }
  }

  async getRefreshedUserTokens(
    refreshToken: string,
    userIdentity: UserIdentity,
  ): Promise<Either<RefreshTokenInvalidError, JWTTokensDto>> {
    const tokenData = this.verifyToken(refreshToken);

    if (tokenData.isNone()) {
      return left(new RefreshTokenInvalidError());
    }

    const currentRefresh = await this.getCurrentRefreshToken(refreshToken).then((maybe) =>
      maybe.asyncMap((token) => {
        return this.refreshUserTokens(token, userIdentity);
      }),
    );

    return currentRefresh.isJust() ? right(currentRefresh.value) : left(new RefreshTokenInvalidError());
  }

  async getUserTokens(userId: string, userIdentity: UserIdentity): Promise<JWTTokensDto> {
    const tokens = this.createTokensByUserID(userId);

    await this.verifyToken(tokens.refreshToken).asyncMap(({ exp: expires }) =>
      this.saveUserToken(userId, tokens.refreshToken, expires, userIdentity),
    );

    return tokens;
  }
}
