import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { LoginGoogleDto } from '@drag/auth/dto/login.dto';
import { GoogleAuthService } from '@drag/auth/services';
import { UsersService } from '@drag/users';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => GoogleAuthService))
    private readonly googleAuthService: GoogleAuthService,
    private readonly usersService: UsersService,
  ) {}

  async authGoogle(loginDto: LoginGoogleDto) {
    const googleUserInfo = await this.googleAuthService.authenticate(loginDto.token);
    const user = await this.usersService.findByEmail(googleUserInfo.email);
    if (!user) {
      return this.usersService.createWithSocialCredentials(googleUserInfo);
    }
    return user;
  }
}
