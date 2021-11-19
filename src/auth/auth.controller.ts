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

import { COOKIE_PATH, REFRESH_TOKEN_COOKIE_NAME } from '@drag/auth/constants';
import { LoginGoogleDto, RefreshDto } from '@drag/auth/dto';
import { JWTTokens } from '@drag/auth/interfaces';
import { AuthService } from '@drag/auth/services';
import { Config } from '@drag/config';
import { ExceptionResponse } from '@drag/exceptions';
import { Cookies, Public, UserAgent } from '@drag/shared/decorators';
import { TokenService } from '@drag/token/token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly maxAge = this.configService.get('jwt.refreshTokenTtl', { infer: true });
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService<Config>,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Авторизация через google' })
  @ApiCreatedResponse({ description: 'Успешная авторизация', type: JWTTokens })
  @ApiBadRequestResponse({ description: 'Некорректные параметры запроса', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Неизвестная ошибка' })
  @Post('login/google')
  async loginGoogle(
    @Body() loginDto: LoginGoogleDto,
    @Res({ passthrough: true }) response: FastifyReply,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    const userIdentity = { ip, fingerprint: loginDto.fingerprint, userAgent };
    const user = await this.authService.authGoogle(loginDto);
    const tokens = await this.tokenService.getUserTokens(user.id, userIdentity);
    response.setCookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
      path: COOKIE_PATH,
      httpOnly: true,
      maxAge: this.maxAge,
    });
    return tokens;
  }

  @Public()
  @ApiOperation({ summary: 'Обновить access и refresh токены' })
  @ApiCreatedResponse({ description: 'Токены успешно обновлены', type: JWTTokens })
  @ApiBadRequestResponse({ description: 'Некорректные параметры запроса', type: ExceptionResponse })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Неизвестная ошибка' })
  @Post('refresh-tokens')
  async refreshTokens(
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() refreshDto: RefreshDto,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
    @Cookies() { refreshToken }: Record<string, string>,
  ) {
    const userIdentity = { ip, fingerprint: refreshDto.fingerprint, userAgent };
    const tokens = await this.tokenService.getRefreshedUserTokens(refreshToken, userIdentity);
    response.setCookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
      path: COOKIE_PATH,
      httpOnly: true,
      maxAge: this.maxAge,
    });
    return tokens;
  }

  @ApiOperation({ summary: 'Метод выхода' })
  @ApiCreatedResponse({ description: 'Пользователь успешно разлогинен' })
  @ApiBadRequestResponse({ description: 'Некорректные параметры запроса', type: ExceptionResponse })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Неизвестная ошибка' })
  @Post('logout')
  async logout(
    @Res({ passthrough: true }) response: FastifyReply,
    @Cookies() { refreshToken }: Record<string, string>,
    @Body() { fingerprint }: RefreshDto,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    const userIdentity = { ip, fingerprint, userAgent };
    await this.tokenService.deleteToken(refreshToken, userIdentity);
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: COOKIE_PATH });
  }

  @ApiOperation({ summary: 'Метод выхода из всех устройств кроме текущего' })
  @ApiCreatedResponse({ description: 'Пользователь успешно разлогинен' })
  @ApiBadRequestResponse({ description: 'Некорректные параметры запроса', type: ExceptionResponse })
  @ApiUnauthorizedResponse({ description: 'Токен невалиден', type: ExceptionResponse })
  @ApiInternalServerErrorResponse({ description: 'Неизвестная ошибка' })
  @Post('logout-all')
  async logoutAll(
    @Cookies() { refreshToken }: Record<string, string>,
    @Body() { fingerprint }: RefreshDto,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
  ) {
    const userIdentity = { ip, fingerprint, userAgent };
    return this.tokenService.deleteAllTokens(refreshToken, userIdentity);
  }
}
