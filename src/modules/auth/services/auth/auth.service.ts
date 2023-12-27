import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Either, merge, right, left } from '@sweet-monads/either';
import { Maybe } from '@sweet-monads/maybe';

import { Config } from 'src/config';
import { UserAccountEntity } from 'src/modules/users';

import { AUTH_SERVICE_OPTIONS, AUTH_GOOGLE_SERVICE } from '../../auth.constants';
import { InvalidTokenError, UnknownProviderError } from '../../auth.errors';
import { SignInDto, SignInProvider } from '../../dto/signIn.dto';
import { UserAuthDto } from '../../dto/userAuth.dto';
import { IAuthServiceOptions } from '../../interfaces/authServiceOptions';
import { IAuthGoogleService } from '../authGoogle/authGoogle.service.interface';
import { IAuthService } from './auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private configService: ConfigService<Config>,
    @Inject(AUTH_GOOGLE_SERVICE) private authGoogleService: IAuthGoogleService,
    @Inject(AUTH_SERVICE_OPTIONS) private authServiceOptions: IAuthServiceOptions,
  ) {}

  async signIn(signInDto: SignInDto): Promise<Either<UnknownProviderError | InvalidTokenError, UserAuthDto>> {
    if (signInDto.provider === SignInProvider.GOOGLE) {
      return this.signInGoogle(signInDto.token);
    }

    if (this.configService.get('isDevelopment', { infer: true })) {
      assertNever(signInDto.provider);
    }

    return left(new UnknownProviderError());
  }

  toUserAuthDto(userAccount: Pick<UserAccountEntity, keyof UserAuthDto>): UserAuthDto {
    const userAuth = new UserAuthDto();

    userAuth.id = userAccount.id;
    userAuth.username = userAccount.username;
    userAuth.firstName = userAccount.firstName;
    userAuth.lastName = userAccount.lastName;
    userAuth.email = userAccount.email;
    userAuth.avatarColor = userAccount.avatarColor;

    return userAuth;
  }

  async getMe(userId: string): Promise<Maybe<UserAuthDto>> {
    return await this.authServiceOptions.usersService
      .getById(userId, ['id', 'email', 'firstName', 'lastName', 'avatarColor', 'username'])
      .then((maybe) => maybe.map((user) => this.toUserAuthDto(user)));
  }

  private async getUserAuthDto(email: string): Promise<Maybe<UserAuthDto>> {
    return this.authServiceOptions.usersService
      .getByEmail(email, ['id', 'username', 'firstName', 'lastName', 'email', 'avatarColor'])
      .then((maybe) => maybe.map((userAccount) => this.toUserAuthDto(userAccount)));
  }

  private async signInGoogle(token: string): Promise<Either<InvalidTokenError, UserAuthDto>> {
    const googleUserInfoEither = await this.authGoogleService.getUserInfo(token);

    const userEither = await googleUserInfoEither.asyncMap((googleUserInfo) =>
      this.getUserAuthDto(googleUserInfo.email),
    );

    return merge([googleUserInfoEither, userEither]).asyncChain(async ([googleUserInfo, user]) => {
      if (user.isJust()) {
        return right(user.value);
      }

      const newUser = await this.authServiceOptions.usersService
        .createWithSocialCredentials(googleUserInfo)
        .then((userAccount) => this.toUserAuthDto(userAccount));

      return right(newUser);
    });
  }
}
