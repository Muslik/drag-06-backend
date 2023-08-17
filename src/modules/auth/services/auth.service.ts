import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';

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

  async getOrCreateUserByGoogleToken(
    loginDto: LoginGoogleDto,
  ): Promise<TE.TaskEither<InvalidTokenError, UserAccountEntity>> {
    return pipe(
      await this.googleAuthService.getUserInfo(loginDto.token),
      TE.match(
        (error) => TE.left(error),
        (googleUserInfo) =>
          pipe(
            TE.fromTask(() => this.usersService.findByEmail(googleUserInfo.email)),
            TE.chain(
              O.fold(
                () =>
                  TE.fromTask(() => this.usersService.createWithSocialCredentials(googleUserInfo)),
                (existingUser) => TE.right(existingUser),
              ),
            ),
          ),
      ),
    )();
  }
}
