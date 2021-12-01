import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { v1 as uuid } from 'uuid';

import { Config } from '@drag/config';
import { AuthenticationException } from '@drag/exceptions';
import { UserIdentity } from '@drag/shared/interfaces';

import { RefreshTokenEntity } from './entities';
import { JWTPayload } from './interfaces';

@Injectable()
export class TokenService {
  private readonly accessTokenTtl: number;
  private readonly refreshTokenTtl: number;
  constructor(
    private connection: Connection,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Config>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {
    this.accessTokenTtl = this.configService.get<number>('jwt.accessTokenTtl', { infer: true });
    this.refreshTokenTtl = this.configService.get<number>('jwt.refreshTokenTtl', { infer: true });
  }

  private createToken(payload: string | Record<string, unknown> | Buffer, expiresIn: number) {
    return this.jwtService.sign(payload, { expiresIn, jwtid: uuid() });
  }

  private createAccessToken(payload: string | Record<string, unknown> | Buffer) {
    return this.createToken(payload, this.accessTokenTtl);
  }

  private createRefreshToken(payload: string | Record<string, unknown> | Buffer) {
    return this.createToken(payload, this.refreshTokenTtl);
  }

  private createTokensByUserID(userId: string) {
    const random = Math.random();
    const accessToken = this.createAccessToken({ userId, random });
    const refreshToken = this.createRefreshToken({ userId, random });
    return { accessToken, refreshToken };
  }

  private async refreshUserTokens(currentToken: RefreshTokenEntity, userIdentity: UserIdentity) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.remove(currentToken);
      const tokens = await this.getUserTokens(currentToken.userAccountId, userIdentity);
      await queryRunner.commitTransaction();
      return tokens;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async saveUserToken(
    userId: string,
    refreshToken: string,
    expires: number,
    { userAgent, ip }: UserIdentity,
  ) {
    const newRefreshToken = this.refreshTokenRepository.create({
      refreshToken,
      userAgent,
      ip,
      userAccountId: userId,
      expires,
    });
    await this.refreshTokenRepository.save(newRefreshToken);
  }

  private getCurrentRefreshToken(refreshToken: string) {
    return this.refreshTokenRepository.findOne({ refreshToken });
  }

  verifyToken(token: string) {
    return this.jwtService.verify<JWTPayload>(token);
  }

  async getRefreshedUserTokens(refreshToken: string, userIdentity: UserIdentity) {
    this.verifyToken(refreshToken);
    const tokenInDb = await this.getCurrentRefreshToken(refreshToken);
    if (!tokenInDb) {
      throw new AuthenticationException();
    }
    return this.refreshUserTokens(tokenInDb, userIdentity);
  }

  async getUserTokens(userId: string, userIdentity: UserIdentity) {
    const tokens = this.createTokensByUserID(userId);
    const { exp: expires } = this.verifyToken(tokens.refreshToken);
    await this.saveUserToken(userId, tokens.refreshToken, expires, userIdentity);
    return tokens;
  }
}
