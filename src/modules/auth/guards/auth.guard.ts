import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { none, Maybe, merge } from '@sweet-monads/maybe';

import { IS_PUBLIC_KEY } from '@libs/decorators';

import { SessionService } from '@modules/session/session.service';
import { TokenService } from '@modules/token/token.service';

import { UnauthorizedError } from '../auth.errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected readonly sessionService: SessionService,
    protected readonly tokenService: TokenService
  ) {}

  private async getUserIdFromSessionId(sessionId: string): Promise<Maybe<string>> {
    if (!sessionId) {
      return none();
    }

    return this.sessionService
      .getSessionById(sessionId)
      .then((maybe) => maybe.map(({ userAccountId }) => userAccountId));
  }

  private getUserIdFromAccessToken(accessToken: string): Maybe<string> {
    if (!accessToken) {
      return none();
    }

    return this.tokenService.verifyToken(accessToken).map(({ userId }) => userId);
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const cookieSessionId = request.cookies.sessionId;
    const headerAccessToken = request.headers.authorization;

    const userIdFromSession = await this.getUserIdFromSessionId(cookieSessionId);
    const userIdFromAccessToken = this.getUserIdFromAccessToken(headerAccessToken);

    return merge([userIdFromSession, userIdFromAccessToken])
      .map((userIds) => {
        const userId = userIds.filter(Boolean)[0];

        if (!userId) {
          throw new UnauthorizedError();
        }

        request.userId = userId;

        return true;
      })
      .unwrap(() => new UnauthorizedException());
  }
}
