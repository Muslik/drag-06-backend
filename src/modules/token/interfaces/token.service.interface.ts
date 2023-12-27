import { Either } from '@sweet-monads/either';
import { Maybe } from '@sweet-monads/maybe';
import { UserIdentity } from 'src/infrastructure/decorators';

import { JWTPayload } from '.';
import { JWTTokensDto } from '../dto/jwtTokens.dto';
import { RefreshTokenInvalidError } from '../token.errors';

export interface ITokenService {
  verifyToken: (token: string) => Maybe<JWTPayload>;
  getRefreshedUserTokens: (
    refreshToken: string,
    userIndentity: UserIdentity,
  ) => Promise<Either<RefreshTokenInvalidError, JWTTokensDto>>;
  getUserTokens: (userId: string, userIndentity: UserIdentity) => Promise<JWTTokensDto>;
}
