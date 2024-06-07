import { Either } from '@sweet-monads/either';
import { Maybe } from '@sweet-monads/maybe';

import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { SignInDtoGoogle, SignInDtoTelegram } from '../../dto/signIn.dto';
import { UserAuthDto } from '../../dto/userAuth.dto';

export interface IAuthService {
  signInGoogle(signInDto: SignInDtoGoogle): Promise<Either<UnknownProviderError | InvalidTokenError, UserAuthDto>>;
  signInTelegram(signInDto: SignInDtoTelegram): Promise<UserAuthDto>;
  getMe(userId: number): Promise<Maybe<UserAuthDto>>;
}
