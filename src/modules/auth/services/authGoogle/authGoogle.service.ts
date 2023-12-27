import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Either, left, right } from '@sweet-monads/either';
import { google, Auth } from 'googleapis';
import { Config } from 'src/config';
import { UserWithSocialCredentialsDto } from 'src/modules/users';

import { InvalidTokenError } from '../../auth.errors';
import { IAuthGoogleService, IGoogleAuthClientProvider } from './authGoogle.service.interface';

@Injectable()
export class GoogleAuthClientProvider {
  constructor(private readonly configService: ConfigService<Config>) {}

  getOAuthClient(): Auth.OAuth2Client {
    const clientID = this.configService.get('google.clientId', { infer: true });
    const clientSecret = this.configService.get('google.clientSecret', { infer: true });

    return new google.auth.OAuth2(clientID, clientSecret);
  }
}

export const GOOGLE_AUTH_CLIENT_PROVIDER = 'OAUTH_CLIENT_PROVIDER';

@Injectable()
export class AuthGoogleService implements IAuthGoogleService {
  private readonly client: ReturnType<IGoogleAuthClientProvider['getOAuthClient']>;

  constructor(@Inject(GOOGLE_AUTH_CLIENT_PROVIDER) private oauthClientProvider: IGoogleAuthClientProvider) {
    this.client = this.oauthClientProvider.getOAuthClient();
  }

  async getUserInfo(token: string): Promise<Either<InvalidTokenError, UserWithSocialCredentialsDto>> {
    try {
      this.client.setCredentials({
        access_token: token,
      });
      const {
        data: { email, id, family_name: lastName, given_name: firstName },
      } = await google.oauth2('v2').userinfo.get({
        auth: this.client,
      });

      return right({
        providerUserId: id ?? '',
        email: email ?? '',
        lastName: lastName ?? '',
        firstName: firstName ?? '',
        providerType: 'google',
      });
    } catch (error) {
      return left(new InvalidTokenError());
    }
  }
}
