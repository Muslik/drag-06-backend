import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { none, Maybe, fromNullable } from '@sweet-monads/maybe';

import { User } from 'src/infrastructure/database';
import { IS_PUBLIC_KEY } from 'src/infrastructure/decorators';
import { SESSION_ID } from 'src/infrastructure/decorators/auth.decorator';
import { ISessionService, SESSION_SERVICE } from 'src/modules/session';
import { ITokenService, TOKEN_SERVICE } from 'src/modules/token';
import { IUserService, USERS_SERVICE } from 'src/modules/user';

import { UnauthorizedError } from '../auth.errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    @Inject(USERS_SERVICE) protected readonly userService: IUserService,
    @Inject(SESSION_SERVICE) protected readonly sessionService: ISessionService,
    @Inject(TOKEN_SERVICE) protected readonly tokenService: ITokenService,
  ) {}

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

  private async getUserFromSessionId(sessionId: string): Promise<Maybe<User>> {
    if (!sessionId) {
      return none();
    }

    return this.sessionService.getSessionUserById(sessionId).then((maybe) => maybe.map(({ user }) => user));
  }

  private async getUserFromAccessToken(accessToken: string): Promise<Maybe<User>> {
    if (!accessToken) {
      return none();
    }

    return this.tokenService
      .verifyToken(accessToken)
      .asyncMap(({ userId }) => this.userService.getById(userId))
      .then((maybe) => maybe.join());
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

    const userFromSession = cookieSessionId ? await this.getUserFromSessionId(cookieSessionId) : none();
    const userFromAccessToken = request.headers.Authorization
      ? await this.getTokenFromHeader(request.headers).asyncChain(this.getUserFromAccessToken)
      : none();

    return userFromSession
      .or(userFromAccessToken)
      .map((user) => {
        request.user = user;

        return true;
      })
      .unwrap(() => new UnauthorizedError());
  }
}
