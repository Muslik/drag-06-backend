import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiErrorResponse, ApiValidationErrorResponse } from '@libs/api/api-error.response';
import { Public, UserIdentity } from '@libs/decorators';

import { LoginGoogleDto } from '@modules/auth/dto';
import { AuthService } from '@modules/auth/services';
import { RefreshDto, JWTTokensDto } from '@modules/oauth/dto';
import { TokenService } from '@modules/token/token.service';

@ApiTags('oauth')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Auth with google oauth token' })
  @ApiCreatedResponse({ description: 'User successfully authorized', type: JWTTokensDto })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('login/google')
  async loginGoogle(@Body() loginDto: LoginGoogleDto, @UserIdentity() userIdentity: UserIdentity) {
    return this.authService
      .getOrCreateUserByGoogleToken(loginDto)
      .then((either) => either.asyncMap((user) => this.tokenService.getUserTokens(user.id, userIdentity)))
      .then((either) =>
        either.unwrap((error) => {
          throw error;
        }),
      );
  }

  @Public()
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiCreatedResponse({
    description: 'Successfully refreshed',
    type: JWTTokensDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ApiErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('refresh-tokens')
  async refreshTokens(@UserIdentity() userIdentity: UserIdentity, @Body() { refreshToken }: RefreshDto) {
    return this.tokenService.getRefreshedUserTokens(refreshToken, userIdentity).then((either) =>
      either.unwrap((error) => {
        throw error;
      }),
    );
  }
}
