import { Inject, Injectable } from '@nestjs/common';
import { Either, merge, right } from '@sweet-monads/either';
import { Maybe } from '@sweet-monads/maybe';

import { User } from 'src/infrastructure/database';

import { AUTH_SERVICE_OPTIONS, AUTH_GOOGLE_SERVICE } from '../../auth.constants';
import { InvalidTokenError } from '../../auth.errors';
import { SignInDtoGoogle, SignInDtoTelegram, SignInProvider } from '../../dto/signIn.dto';
import { UserAuthDto } from '../../dto/userAuth.dto';
import { IAuthServiceOptions } from '../../interfaces/authServiceOptions';
import { IAuthGoogleService } from '../authGoogle/authGoogle.service.interface';
import { IAuthService } from './auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(AUTH_GOOGLE_SERVICE) private authGoogleService: IAuthGoogleService,
    @Inject(AUTH_SERVICE_OPTIONS) private authServiceOptions: IAuthServiceOptions,
  ) {}

  private toUserAuthDto(user: Pick<User, keyof UserAuthDto>): UserAuthDto {
    const userAuth = new UserAuthDto();

    userAuth.id = user.id;
    userAuth.username = user.username;
    userAuth.firstName = user.firstName;
    userAuth.lastName = user.lastName;
    userAuth.email = user.email;
    userAuth.avatarColor = user.avatarColor;
    userAuth.role = user.role;

    return userAuth;
  }

  async getMe(userId: number): Promise<Maybe<UserAuthDto>> {
    return await this.authServiceOptions.userService
      .getById(userId)
      .then((maybe) => maybe.map((user) => this.toUserAuthDto(user)));
  }

  async signInTelegram(signInInfo: SignInDtoTelegram): Promise<UserAuthDto> {
    const { userId, username, firstName, lastName = '' } = signInInfo;

    const userMaybe = await this.authServiceOptions.userService
      .getByProviderUserId(userId)
      .then((maybe) => maybe.map(this.toUserAuthDto));

    if (userMaybe.isJust()) {
      return userMaybe.value;
    }

    const newUser = await this.authServiceOptions.userService
      .createWithSocialCredentials({
        username,
        email: '',
        lastName,
        firstName,
        providerType: SignInProvider.TELEGRAM,
        providerUserId: userId,
      })
      .then((userAccount) => this.toUserAuthDto(userAccount));

    return newUser;
  }

  async signInGoogle({ token }: SignInDtoGoogle): Promise<Either<InvalidTokenError, UserAuthDto>> {
    const googleUserInfoEither = await this.authGoogleService.getUserInfo(token);

    const userEither = await googleUserInfoEither.asyncMap((googleUserInfo) =>
      this.authServiceOptions.userService
        .getByEmail(googleUserInfo.email)
        .then((either) => either.map((userAccount) => this.toUserAuthDto(userAccount))),
    );

    return merge([googleUserInfoEither, userEither]).asyncChain(async ([googleUserInfo, user]) => {
      if (user.isJust()) {
        return right(user.value);
      }

      const newUser = await this.authServiceOptions.userService
        .createWithSocialCredentials(googleUserInfo)
        .then((userAccount) => this.toUserAuthDto(userAccount));

      return right(newUser);
    });
  }
}
