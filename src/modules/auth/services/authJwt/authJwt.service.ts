import { Inject, Injectable } from '@nestjs/common';
import { Either } from '@sweet-monads/either';
import { UserIdentity } from 'src/infrastructure/decorators';
import { JWTTokensDto, RefreshTokenInvalidError } from 'src/modules/token';

import { AUTH_SERVICE, AUTH_SERVICE_OPTIONS } from '../../auth.constants';
import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { RefreshTokenDto } from '../../dto/refreshToken.dto';
import { SignInDto } from '../../dto/signIn.dto';
import { IAuthServiceOptions } from '../../interfaces/authServiceOptions';
import { IAuthService } from '../auth/auth.service.interface';
import { IAuthJwtService } from './authJwt.service.interface';

@Injectable()
export class AuthJwtService implements IAuthJwtService {
  constructor(
    @Inject(AUTH_SERVICE) private authService: IAuthService,
    @Inject(AUTH_SERVICE_OPTIONS) private authServiceOptions: IAuthServiceOptions,
  ) {}

  async signIn(
    signInDto: SignInDto,
    userIdentity: UserIdentity,
  ): Promise<Either<UnknownProviderError | InvalidTokenError, JWTTokensDto>> {
    return await this.authService
      .signIn(signInDto)
      .then((either) =>
        either.asyncMap(async (user) => this.authServiceOptions.tokenService.getUserTokens(user.id, userIdentity)),
      );
  }

  async refresh(
    { refreshToken }: RefreshTokenDto,
    userIdentity: UserIdentity,
  ): Promise<Either<RefreshTokenInvalidError, JWTTokensDto>> {
    return await this.authServiceOptions.tokenService.getRefreshedUserTokens(refreshToken, userIdentity);
  }
}
