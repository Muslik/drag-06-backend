import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { none, Maybe, fromNullable } from '@sweet-monads/maybe';
import { IS_PUBLIC_KEY } from 'src/infrastructure/decorators';
import { SESSION_ID } from 'src/infrastructure/decorators/auth.decorator';
import { SessionService } from 'src/modules/session';
import { TokenService } from 'src/modules/token';

import { UnauthorizedError } from '../auth.errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected readonly sessionService: SessionService,
    protected readonly tokenService: TokenService,
  ) {}

  private async getUserIdFromSessionId(sessionId: string): Promise<Maybe<string>> {
    if (!sessionId) {
      return none();
    }

    return this.sessionService
      .getSessionById(sessionId)
      .then((maybe) => maybe.map(({ userAccountId }) => userAccountId));
  }

  private getTokenFromHeader(headers: Record<string, string>): Maybe<string> {
    const header = headers.Authorization;

    if (!header) {
      return none();
    }

    const [type, token] = header.split(' ');

    if (type !== 'Bearer') {
      return none();
    }

    return fromNullable(token);
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
    const cookieSessionId = request.cookies[SESSION_ID];

    const userIdFromSession = await this.getUserIdFromSessionId(cookieSessionId);
    const userIdFromAccessToken = this.getTokenFromHeader(request.headers).chain(this.getUserIdFromAccessToken);

    return userIdFromSession
      .or(userIdFromAccessToken)
      .map((userId) => {
        if (!userId) {
          throw new UnauthorizedError();
        }

        request.userId = userId;

        return true;
      })
      .unwrap(() => new UnauthorizedError());
  }
}
