import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';

export const SESSION_ID = 'sessionId';
export const ACCESS_TOKEN = 'accessToken';

export function Auth() {
  return applyDecorators(ApiBearerAuth(ACCESS_TOKEN), ApiCookieAuth(SESSION_ID));
}

export function JWTAuth() {
  return ApiBearerAuth(ACCESS_TOKEN);
}

export function CookieAuth() {
  return ApiCookieAuth(SESSION_ID);
}
