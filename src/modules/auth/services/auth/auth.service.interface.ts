import { Either } from '@sweet-monads/either';
import { Maybe } from '@sweet-monads/maybe';

import { User } from 'src/infrastructure/database';

import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { SignInDto } from '../../dto/signIn.dto';
import { UserAuthDto } from '../../dto/userAuth.dto';

export interface IAuthService {
  signIn(signInDto: SignInDto): Promise<Either<UnknownProviderError | InvalidTokenError, UserAuthDto>>;
  toUserAuthDto(user: Pick<User, keyof UserAuthDto>): UserAuthDto;
  getMe(userId: number): Promise<Maybe<UserAuthDto>>;
}
