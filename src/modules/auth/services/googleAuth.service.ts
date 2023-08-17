import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TE from 'fp-ts/TaskEither';
import { google, Auth } from 'googleapis';

import { Config } from '@src/config';

import { UserWithSocialCredentials } from '@modules/users';

import { InvalidTokenError } from '../auth.errors';

@Injectable()
export class GoogleAuthService {
  oauthClient: Auth.OAuth2Client;
  clientID = this.configService.get('google.clientId', { infer: true });
  clientSecret = this.configService.get('google.clientSecret', { infer: true });
  constructor(private readonly configService: ConfigService<Config>) {
    this.oauthClient = new google.auth.OAuth2(this.clientID, this.clientSecret);
  }

  async getUserInfo(
    token: string
  ): Promise<TE.TaskEither<InvalidTokenError, UserWithSocialCredentials>> {
    return TE.tryCatch(
      async () => {
        this.oauthClient.setCredentials({
          access_token: token,
        });
        const {
          data: { email, id, family_name: lastName, given_name: firstName },
        } = await google.oauth2('v2').userinfo.get({
          auth: this.oauthClient,
        });

        return {
          providerUserId: id ?? '',
          email: email ?? '',
          lastName: lastName ?? '',
          firstName: firstName ?? '',
          providerType: 'google',
        };
      },
      () => new InvalidTokenError()
    );
  }
}
