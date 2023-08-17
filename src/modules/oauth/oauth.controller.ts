import { BadRequestException, Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';

import { ApiErrorResponse } from '@libs/api/api-error.response';
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
    private readonly tokenService: TokenService
  ) {}

  @Public()
  @ApiOperation({ summary: 'Auth with google oauth token' })
  @ApiCreatedResponse({ description: 'User successfully authorized', type: JWTTokensDto })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong' })
  @Post('login/google')
  async loginGoogle(@Body() loginDto: LoginGoogleDto, @UserIdentity() userIdentity: UserIdentity) {
    return pipe(
      await this.authService.getOrCreateUserByGoogleToken(loginDto),
      TE.chain((user) => TE.fromTask(() => this.tokenService.getUserTokens(user.id, userIdentity))),
      TE.match(
        (error) => {
          throw error;
        },
        (token) => token
      )
    )();
  }

  @Public()
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiCreatedResponse({
    description: 'Successfully refreshed',
    type: JWTTokensDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiErrorResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ApiErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong' })
  @Post('refresh-tokens')
  async refreshTokens(
    @UserIdentity() userIdentity: UserIdentity,
    @Body() { refreshToken }: RefreshDto
  ) {
    return pipe(
      await this.tokenService.getRefreshedUserTokens(refreshToken, userIdentity),
      TE.match(
        (error) => {
          throw new UnauthorizedException(error.message);
        },
        (token) => token
      )
    )();
  }
}
