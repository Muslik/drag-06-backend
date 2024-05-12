import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Either, left, right } from '@sweet-monads/either';
import { just, Maybe, none } from '@sweet-monads/maybe';
import { v4 as uuid } from 'uuid';

import { ConfigService } from 'src/infrastructure/config';
import { RefreshToken } from 'src/infrastructure/database';
import { UserIdentity } from 'src/infrastructure/decorators';

import { JWTTokensDto } from './dto/jwtTokens.dto';
import { JWTPayload } from './interfaces';
import { ITokenService } from './interfaces/token.service.interface';
import { RefreshTokenRepository } from './refreshToken.repository';
import { RefreshTokenInvalidError } from './token.errors';

@Injectable()
export class TokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  private createTokensByUserID(userId: number): JWTTokensDto {
    const payload = { userId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwt.accessTokenTtl,
      jwtid: uuid(),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwt.refreshTokenTtl,
      jwtid: uuid(),
    });

    return { accessToken, refreshToken };
  }

  @Transactional()
  private async refreshUserTokens(currentToken: RefreshToken, userIdentity: UserIdentity): Promise<JWTTokensDto> {
    await this.refreshTokenRepository.deleteById(currentToken.id);

    return this.getUserTokens(currentToken.userId, userIdentity);
  }

  private async getCurrentRefreshToken(refreshToken: string): Promise<Maybe<RefreshToken>> {
    return this.refreshTokenRepository.findByToken(refreshToken);
  }

  verifyToken(token: string): Maybe<JWTPayload> {
    try {
      const data = this.jwtService.verify<JWTPayload>(token);

      return just(data);
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

  async getUserTokens(userId: number, userIdentity: UserIdentity): Promise<JWTTokensDto> {
    const tokens = this.createTokensByUserID(userId);

    return this.verifyToken(tokens.refreshToken)
      .asyncMap(({ exp: expires }) =>
        this.refreshTokenRepository.insert({
          userId,
          token: tokens.refreshToken,
          expires,
          ...userIdentity,
        }),
      )
      .then(() => tokens);
  }
}
