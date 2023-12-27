import { Either } from '@sweet-monads/either';
import { UserIdentity } from 'src/infrastructure/decorators';
import { RefreshTokenInvalidError, JWTTokensDto } from 'src/modules/token';

import { UnknownProviderError, InvalidTokenError } from '../../auth.errors';
import { RefreshTokenDto } from '../../dto/refreshToken.dto';
import { SignInDto } from '../../dto/signIn.dto';

export interface IAuthJwtService {
  signIn(
    signInDto: SignInDto,
    userIdentity: UserIdentity,
  ): Promise<Either<UnknownProviderError | InvalidTokenError, JWTTokensDto>>;
  refresh(
    refreshDto: RefreshTokenDto,
    userIdentity: UserIdentity,
  ): Promise<Either<RefreshTokenInvalidError, JWTTokensDto>>;
}
