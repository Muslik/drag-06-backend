import { Body, Controller, Ip, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { SESSION_ID } from '@drag/auth/constants';
import { LoginGoogleDto } from '@drag/auth/dto';
import { AuthService } from '@drag/auth/services';
import { Config } from '@drag/config';
import { ExceptionResponse } from '@drag/exceptions';
import { SessionUser } from '@drag/session/interfaces';
import { SessionService } from '@drag/session/session.service';
import { Cookies, Public, UserAgent, UserId } from '@drag/shared/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly maxAge = this.configService.get('jwt.refreshTokenTtl', { infer: true });
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService<Config>,
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
    const { sessionUser, sessionId } = await this.sessionService.createSession(user, userIdentity);
    response.setCookie(SESSION_ID, sessionId, { httpOnly: true, path: '/' });

    return sessionUser;
  }

  @ApiOperation({ summary: 'Read session token and return session user data' })
  @ApiCreatedResponse({ description: 'Session exist', type: SessionUser })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong' })
  @Post('session')
  getSessionUser(
    @Res({ passthrough: true }) response: FastifyReply,
    @Cookies() { sessionId }: Record<string, string>,
  ) {
    return this.sessionService.getSessionUserById(sessionId);
  }

  @ApiOperation({ summary: 'Delete current session' })
  @ApiCreatedResponse({ description: 'Session deleted' })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong' })
  @Post('logout')
  async logout(
    @Res({ passthrough: true }) response: FastifyReply,
    @Cookies() { sessionId }: Record<string, string>,
  ) {
    await this.sessionService.deleteSession(sessionId);
    response.clearCookie(SESSION_ID);
  }

  @ApiOperation({ summary: 'Delete all sessions' })
  @ApiCreatedResponse({ description: 'Sessions deleted' })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong' })
  @Post('logout-all')
  async logoutAll(@UserId() userId: string) {
    return this.sessionService.deleteAllSessions(userId);
  }
}
