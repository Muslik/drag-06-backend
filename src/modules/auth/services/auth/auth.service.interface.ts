import { Either } from '@sweet-monads/either';
import { Maybe } from '@sweet-monads/maybe';

import { UserAccountEntity } from 'src/modules/user';

import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { SignInDto } from '../../dto/signIn.dto';
import { UserAuthDto } from '../../dto/userAuth.dto';

export interface IAuthService {
  signIn(signInDto: SignInDto): Promise<Either<UnknownProviderError | InvalidTokenError, UserAuthDto>>;
  toUserAuthDto(userAccount: Pick<UserAccountEntity, keyof UserAuthDto>): UserAuthDto;
  getMe(userId: string): Promise<Maybe<UserAuthDto>>;
}
