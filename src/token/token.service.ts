import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Not, QueryRunner, Repository } from 'typeorm';
import { v1 as uuid } from 'uuid';

import { Config } from '@drag/config';
import { AuthenticationException } from '@drag/exceptions';

import { RefreshTokenEntity } from './entities';
import { JWTPayload, UserIdentity } from './interfaces';

const MAX_TOKENS_COUNT = 5;

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
    const signedPayload = this.jwtService.sign(payload, { expiresIn, jwtid: uuid() });
    return signedPayload;
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

  private async getExceededRefreshTokens(userId: string, queryRunner: QueryRunner) {
    const [tokens, tokensCount] = await queryRunner.manager.findAndCount(RefreshTokenEntity, {
      userAccountId: userId,
    });

    if (tokensCount === MAX_TOKENS_COUNT) {
      return tokens;
    }
    return null;
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
    { fingerprint, userAgent, ip }: UserIdentity,
  ) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newRefreshToken = queryRunner.manager.create(RefreshTokenEntity, {
        refreshToken,
        fingerprint,
        userAgent,
        ip,
        userAccountId: userId,
        expires,
      });
      const exceededTokens = await this.getExceededRefreshTokens(userId, queryRunner);
      if (exceededTokens) {
        await queryRunner.manager.remove(exceededTokens);
      }
      await queryRunner.manager.save(newRefreshToken);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getValidRefreshToken(refreshToken: string, userIdentity: UserIdentity) {
    const tokenInDb = await this.refreshTokenRepository.findOne({ refreshToken });
    if (!tokenInDb) {
      return null;
    }
    if (tokenInDb.fingerprint !== userIdentity.fingerprint) {
      await this.refreshTokenRepository.delete(tokenInDb);
      return null;
    }
    return tokenInDb;
  }

  verifyToken(token: string) {
    return this.jwtService.verify<JWTPayload>(token);
  }

  async deleteAllTokens(refreshToken: string, userIdentity: UserIdentity) {
    const tokenInDb = await this.getValidRefreshToken(refreshToken, userIdentity);
    if (!tokenInDb) {
      throw new AuthenticationException();
    }
    return this.refreshTokenRepository.delete({
      userAccountId: tokenInDb.userAccountId,
      refreshToken: Not(refreshToken),
    });
  }

  async deleteToken(refreshToken: string, userIdentity: UserIdentity) {
    this.verifyToken(refreshToken);
    const tokenInDb = await this.getValidRefreshToken(refreshToken, userIdentity);
    if (!tokenInDb) {
      throw new AuthenticationException();
    }
    return this.refreshTokenRepository.delete(tokenInDb);
  }

  async getRefreshedUserTokens(refreshToken: string, userIdentity: UserIdentity) {
    this.verifyToken(refreshToken);
    const tokenInDb = await this.getValidRefreshToken(refreshToken, userIdentity);
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
