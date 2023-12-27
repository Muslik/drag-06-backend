import { Either } from '@sweet-monads/either';
import { Auth } from 'googleapis';
import { UserWithSocialCredentialsDto } from 'src/modules/users';

import { InvalidTokenError } from '../../auth.errors';

export interface IAuthGoogleService {
  getUserInfo(token: string): Promise<Either<InvalidTokenError, UserWithSocialCredentialsDto>>;
}

export interface IGoogleAuthClientProvider {
  getOAuthClient(): Auth.OAuth2Client;
}
