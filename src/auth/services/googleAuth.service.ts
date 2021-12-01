import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';

import { Config } from '@drag/config';
import { TokenException } from '@drag/exceptions';
import { UserWithSocialCredentials } from '@drag/users/interfaces';

@Injectable()
export class GoogleAuthService {
  oauthClient: Auth.OAuth2Client;
  clientID = this.configService.get('google.clientId', { infer: true });
  clientSecret = this.configService.get('google.clientSecret', { infer: true });
  constructor(private readonly configService: ConfigService<Config>) {
    this.oauthClient = new google.auth.OAuth2(this.clientID, this.clientSecret);
  }

  private async getUserInfo(token: string) {
    try {
      this.oauthClient.setCredentials({
        access_token: token,
      });
      const {
        data: { email, id: providerUserId, family_name: lastName, given_name: firstName },
      } = await google.oauth2('v2').userinfo.get({
        auth: this.oauthClient,
      });
      return {
        providerUserId,
        email,
        lastName,
        firstName,
        providerType: 'google',
      } as UserWithSocialCredentials;
    } catch (error) {
      throw new TokenException();
    }
  }

  async authenticate(token: string) {
    return this.getUserInfo(token);
  }
}
