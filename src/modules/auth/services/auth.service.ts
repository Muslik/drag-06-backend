import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Either, merge, right } from '@sweet-monads/either';

import { LoginGoogleDto } from '@modules/auth/dto';
import { UserAccountEntity, UsersService } from '@modules/users';

import { InvalidTokenError } from '../auth.errors';
import { GoogleAuthService } from './googleAuth.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => GoogleAuthService))
    private readonly googleAuthService: GoogleAuthService,
    private readonly usersService: UsersService,
  ) {}

  async getOrCreateUserByGoogleToken(loginDto: LoginGoogleDto): Promise<Either<InvalidTokenError, UserAccountEntity>> {
    const googleUserInfoEither = await this.googleAuthService.getUserInfo(loginDto.token);

    const userEither = await googleUserInfoEither.asyncMap((googleUserInfo) =>
      this.usersService.findByEmail(googleUserInfo.email),
    );

    return merge([googleUserInfoEither, userEither]).asyncChain(async ([googleUserInfo, user]) => {
      if (user.isJust()) {
        return right(user.value);
      }

      const newUser = await this.usersService.createWithSocialCredentials(googleUserInfo);

      return right(newUser);
    });
  }
}
