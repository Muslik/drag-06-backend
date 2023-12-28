import { Either } from '@sweet-monads/either';

import { UserIdentity } from 'src/infrastructure/decorators';

import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { SignInDto } from '../../dto/signIn.dto';
import { UserAuthDto } from '../../dto/userAuth.dto';

export interface IAuthSessionService {
  signIn(
    signInDto: SignInDto,
    userIdentity: UserIdentity,
  ): Promise<Either<UnknownProviderError | InvalidTokenError, { user: UserAuthDto; sessionId: string }>>;
  logout(sessionId: string): Promise<void>;
}
