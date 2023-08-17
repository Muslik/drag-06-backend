import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { DataSource, Repository } from "typeorm";
import { v1 as uuid } from "uuid";

import { Config } from "@src/config";
import { UserIdentity } from "@libs/decorators";

import { RefreshTokenEntity } from "./entities";
import { JWTPayload, Token } from "./interfaces";
import { RefreshTokenInvalidError } from "./token.errors";

@Injectable()
export class TokenService {
  private readonly accessTokenTtl: number;
  private readonly refreshTokenTtl: number;
  constructor(
    private dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Config>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>
  ) {
    this.accessTokenTtl = this.configService.get<number>("jwt.accessTokenTtl", {
      infer: true,
    });
    this.refreshTokenTtl = this.configService.get<number>(
      "jwt.refreshTokenTtl",
      { infer: true }
    );
  }

  private createTokensByUserID(userId: string): Token {
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

  private async refreshUserTokens(
    currentToken: RefreshTokenEntity,
    userIdentity: UserIdentity
  ): Promise<Token> {
    return this.dataSource.transaction(async (transactionEntityManager) => {
      transactionEntityManager.remove(currentToken);

      return this.getUserTokens(currentToken.userAccountId, userIdentity);
    });
  }

  private async saveUserToken(
    userId: string,
    refreshToken: string,
    expires: number,
    { userAgent, ip }: UserIdentity
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

  private async getCurrentRefreshToken(
    refreshToken: string
  ): Promise<O.Option<RefreshTokenEntity>> {
    return O.fromNullable(
      await this.refreshTokenRepository.findOne({ where: { refreshToken } })
    );
  }

  verifyToken(token: string): JWTPayload {
    return this.jwtService.verify<JWTPayload>(token);
  }

  async getRefreshedUserTokens(
    refreshToken: string,
    userIdentity: UserIdentity
  ): Promise<TE.TaskEither<RefreshTokenInvalidError, Token>> {
    this.verifyToken(refreshToken);

    return pipe(
      await this.getCurrentRefreshToken(refreshToken),
      O.fold(
        () => TE.left(new RefreshTokenInvalidError()),
        (token) =>
          TE.fromTask(() => this.refreshUserTokens(token, userIdentity))
      )
    );
  }

  async getUserTokens(
    userId: string,
    userIdentity: UserIdentity
  ): Promise<Token> {
    const tokens = this.createTokensByUserID(userId);
    const { exp: expires } = this.verifyToken(tokens.refreshToken);
    await this.saveUserToken(
      userId,
      tokens.refreshToken,
      expires,
      userIdentity
    );

    return tokens;
  }
}
