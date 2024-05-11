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

import { ApiErrorResponse, ApiValidationErrorResponse } from 'src/infrastructure/api/api-error.response';
import { Cookies, Public, UserId, UserIdentity } from 'src/infrastructure/decorators';
import { SESSION_ID } from 'src/infrastructure/decorators/auth.decorator';

import { JWTTokensDto } from '../token';
import { AUTH_JWT_SERVICE, AUTH_SERVICE, AUTH_SESSION_SERVICE } from './auth.constants';
import { UnauthorizedError } from './auth.errors';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { SignInDto } from './dto/signIn.dto';
import { UserAuthDto } from './dto/userAuth.dto';
import { IAuthService } from './services/auth/auth.service.interface';
import { IAuthJwtService } from './services/authJwt/authJwt.service.interface';
import { IAuthSessionService } from './services/authSession/authSession.service.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SESSION_SERVICE) private authSessionService: IAuthSessionService,
    @Inject(AUTH_JWT_SERVICE) private authJwtService: IAuthJwtService,
    @Inject(AUTH_SERVICE) private authService: IAuthService,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Authorize and get user session' })
  @ApiCreatedResponse({
    description: 'User successfully authorized',
    type: UserAuthDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: FastifyReply,
    @UserIdentity() userIdentity: UserIdentity,
  ) {
    return this.authSessionService.signIn(signInDto, userIdentity).then((either) =>
      either
        .mapRight(({ user, sessionId }) => {
          response.setCookie(SESSION_ID, sessionId, { httpOnly: true, path: '/' });

          return user;
        })
        .unwrap((error) => {
          throw error;
        }),
    );
  }

  @Public()
  @ApiOperation({ summary: 'Authorize and get JWT tokens' })
  @ApiCreatedResponse({ description: 'User successfully authorized', type: JWTTokensDto })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('jwt/sign-in')
  async jwtSignIn(@Body() signInDto: SignInDto, @UserIdentity() userIdentity: UserIdentity) {
    return this.authJwtService.signIn(signInDto, userIdentity).then((either) =>
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
  @Post('jwt/refresh')
  async refreshTokens(@UserIdentity() userIdentity: UserIdentity, @Body() refreshToken: RefreshTokenDto) {
    return this.authJwtService.refresh(refreshToken, userIdentity).then((either) =>
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
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('me')
  async me(@UserId() userId: number) {
    const userMaybe = await this.authService.getMe(userId);

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
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: FastifyReply, @Cookies() { sessionId }: Record<string, string>) {
    if (!sessionId) {
      throw new UnauthorizedError();
    }

    await this.authSessionService.logout(sessionId);
    response.clearCookie(SESSION_ID);
  }
}
