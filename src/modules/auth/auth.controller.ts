import { Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { ApiErrorResponse, ApiValidationErrorResponse } from '@libs/api/api-error.response';
import { Cookies, Public, UserIdentity, UserId } from '@libs/decorators';

import { SESSION_ID } from '@modules/auth/constants';
import { AuthService, LoginGoogleDto } from '@modules/auth/index';
import { SessionUserDto } from '@modules/session/dto';
import { SessionService } from '@modules/session/session.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Auth with google oauth token' })
  @ApiCreatedResponse({
    description: 'User successfully authorized',
    type: SessionUserDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('login/google')
  async loginGoogle(
    @Body() loginDto: LoginGoogleDto,
    @Res({ passthrough: true }) response: FastifyReply,
    @UserIdentity() userIdentity: UserIdentity,
  ) {
    return this.authService
      .getOrCreateUserByGoogleToken(loginDto)
      .then((either) => either.asyncMap((user) => this.sessionService.createSession(user, userIdentity)))
      .then((either) =>
        either
          .mapRight(({ sessionUser, sessionId }) => {
            response.setCookie(SESSION_ID, sessionId, { httpOnly: true, path: '/' }).send(sessionUser);
          })
          .unwrap((error) => {
            throw error;
          }),
      );
  }

  @ApiOperation({ summary: 'Read session token and return session user data' })
  @ApiCreatedResponse({ description: 'Session exist', type: SessionUserDto })
  @ApiUnauthorizedResponse({
    description: 'User not authorized',
    type: ApiErrorResponse,
  })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('session')
  async getSessionUser(@Cookies() { sessionId }: Record<string, string>) {
    const session = await this.sessionService.getSessionUserById(sessionId);

    return session.isJust() ? session.value : null;
  }

  @ApiOperation({ summary: 'Delete current session' })
  @ApiCreatedResponse({ description: 'Session deleted' })
  @ApiUnauthorizedResponse({
    description: 'User not authorized',
    type: ApiErrorResponse,
  })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: FastifyReply, @Cookies() { sessionId }: Record<string, string>) {
    await this.sessionService.deleteSession(sessionId);
    response.clearCookie(SESSION_ID);
  }

  @ApiOperation({ summary: 'Delete all sessions' })
  @ApiCreatedResponse({ description: 'Sessions deleted' })
  @ApiUnauthorizedResponse({
    description: 'User not authorized',
    type: ApiErrorResponse,
  })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('logout-all')
  async logoutAll(@UserId() userId: string) {
    return this.sessionService.deleteAllSessions(userId);
  }
}
