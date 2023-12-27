import { Inject } from '@nestjs/common';
import { Either } from '@sweet-monads/either';

import { UserIdentity } from 'src/infrastructure/decorators';

import { AUTH_SERVICE, AUTH_SERVICE_OPTIONS } from '../../auth.constants';
import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { SignInDto } from '../../dto/signIn.dto';
import { UserAuthDto } from '../../dto/userAuth.dto';
import { IAuthServiceOptions } from '../../interfaces/authServiceOptions';
import { IAuthService } from '../auth/auth.service.interface';
import { IAuthSessionService } from './authSession.service.interface';

export class AuthSessionService implements IAuthSessionService {
  constructor(
    @Inject(AUTH_SERVICE) private authService: IAuthService,
    @Inject(AUTH_SERVICE_OPTIONS) private authServiceOptions: IAuthServiceOptions,
  ) {}

  async signIn(
    signInDto: SignInDto,
    userIdentity: UserIdentity,
  ): Promise<Either<UnknownProviderError | InvalidTokenError, { user: UserAuthDto; sessionId: string }>> {
    return await this.authService.signIn(signInDto).then((either) =>
      either.asyncMap(async (user) => {
        const { sessionId } = await this.authServiceOptions.sessionService.createSession(user.id, userIdentity);

        return { user, sessionId };
      }),
    );
  }

  async logout(sessionId: string): Promise<void> {
    return await this.authServiceOptions.sessionService.deleteSession(sessionId);
  }
}
