import { Body, Controller, Ip, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { LoginGoogleDto } from '@drag/auth/dto';
import { AuthService } from '@drag/auth/services';
import { ExceptionResponse } from '@drag/exceptions';
import { RefreshDto } from '@drag/oauth/dto/refresh.dto';
import { JWTTokens } from '@drag/oauth/interfaces';
import { SessionUser } from '@drag/session/interfaces';
import { Public, UserAgent } from '@drag/shared/decorators';
import { TokenService } from '@drag/token/token.service';

@ApiTags('oauth')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Auth with google oauth token' })
  @ApiCreatedResponse({ description: 'User successfully authorized', type: SessionUser })
  @ApiBadRequestResponse({ description: 'Bad request', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong' })
  @Post('login/google')
  async loginGoogle(
    @Body() loginDto: LoginGoogleDto,
    @Res({ passthrough: true }) response: FastifyReply,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    const userIdentity = { ip, userAgent };
    const user = await this.authService.authGoogle(loginDto);
    return this.tokenService.getUserTokens(user.id, userIdentity);
  }

  @Public()
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiCreatedResponse({
    description: 'Successfully refreshed',
    type: JWTTokens,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ExceptionResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong' })
  @Post('refresh-tokens')
  async refreshTokens(
    @Res({ passthrough: true }) response: FastifyReply,
    @UserAgent() userAgent: string,
    @Body() { refreshToken }: RefreshDto,
    @Ip() ip: string,
  ) {
    const userIdentity = { ip, userAgent };
    return this.tokenService.getRefreshedUserTokens(refreshToken, userIdentity);
  }
}
