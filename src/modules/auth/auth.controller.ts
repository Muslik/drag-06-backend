import { Inject, Body, Controller, Post, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { ApiErrorResponse, ApiValidationErrorResponse } from 'src/infrastructure/api';
import { ConfigService } from 'src/infrastructure/config';
import { User } from 'src/infrastructure/database';
import { Cookies, Public, RequestUser, UserIdentity } from 'src/infrastructure/decorators';
import { SESSION_ID } from 'src/infrastructure/decorators/auth.decorator';

import { JWTTokensDto } from '../token';
import { AUTH_SERVICE, AUTH_SERVICE_OPTIONS } from './auth.constants';
import { UnauthorizedError } from './auth.errors';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { SignInDtoGoogle, SignInDtoTelegram } from './dto/signIn.dto';
import { UserAuthDto } from './dto/userAuth.dto';
import { IAuthServiceOptions } from './interfaces/authServiceOptions';
import { IAuthService } from './services/auth/auth.service.interface';

@ApiTags('auth')
@Controller('auth')
@ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private authService: IAuthService,
    @Inject(AUTH_SERVICE_OPTIONS) private authServiceOptions: IAuthServiceOptions,
    private readonly configService: ConfigService,
  ) {}

  private async createSession(
    response: FastifyReply,
    userId: number,
    userIdentity: UserIdentity,
  ): Promise<JWTTokensDto> {
    const { sessionId } = await this.authServiceOptions.sessionService.createSession(userId, userIdentity);
    const tokens = this.authServiceOptions.tokenService.getUserTokens(userId, userIdentity);

    response.setCookie(SESSION_ID, sessionId, {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: this.configService.isDevelopment ? 'none' : 'strict',
    });

    return tokens;
  }

  @Public()
  @ApiOperation({ summary: 'Authorize with google and get user session/tokens' })
  @ApiCreatedResponse({
    description: 'User successfully authorized',
    type: JWTTokensDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @Post('sign-in/google')
  async signInGoogle(
    @Body() signInDto: SignInDtoGoogle,
    @Res({ passthrough: true }) response: FastifyReply,
    @UserIdentity() userIdentity: UserIdentity,
  ): Promise<JWTTokensDto> {
    return this.authService.signInGoogle(signInDto).then((either) =>
      either
        .mapRight((user) => this.createSession(response, user.id, userIdentity))
        .unwrap((error) => {
          throw error;
        }),
    );
  }

  @Public()
  @ApiOperation({ summary: 'Authorize with telegram and get user session/tokens' })
  @ApiCreatedResponse({
    description: 'User successfully authorized',
    type: JWTTokensDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @Post('sign-in/telegram')
  async signInTelegram(
    @Body() signInDto: SignInDtoTelegram,
    @Res({ passthrough: true }) response: FastifyReply,
    @UserIdentity() userIdentity: UserIdentity,
  ): Promise<JWTTokensDto> {
    const user = await this.authService.signInTelegram(signInDto);

    return this.createSession(response, user.id, userIdentity);
  }

  @Public()
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiCreatedResponse({
    description: 'Successfully refreshed',
    type: JWTTokensDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ApiErrorResponse })
  @Post('jwt/refresh')
  async refreshTokens(@UserIdentity() userIdentity: UserIdentity, @Body() { refreshToken }: RefreshTokenDto) {
    return this.authServiceOptions.tokenService.getRefreshedUserTokens(refreshToken, userIdentity).then((either) =>
      either.unwrap((error) => {
        throw error;
      }),
    );
  }

  @ApiOperation({ summary: 'Read session token and return session user data' })
  @ApiCreatedResponse({ description: 'Session exist', type: UserAuthDto })
  @ApiUnauthorizedResponse({
    description: 'User not authorized',
    type: ApiErrorResponse,
  })
  @Post('me')
  async me(@RequestUser() user: User) {
    const userMaybe = await this.authService.getMe(user.id);

    if (userMaybe.isJust()) {
      return userMaybe.value;
    }

    throw new UnauthorizedError();
  }

  @ApiOperation({ summary: 'Delete current session' })
  @ApiCreatedResponse({ description: 'Session deleted' })
  @ApiUnauthorizedResponse({
    description: 'User not authorized',
    type: ApiErrorResponse,
  })
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: FastifyReply, @Cookies() { sessionId }: Record<string, string>) {
    if (!sessionId) {
      throw new UnauthorizedError();
    }

    await this.authServiceOptions.sessionService.deleteSession(sessionId);
    response.clearCookie(SESSION_ID);
  }
}
