import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthenticationException } from '@drag/exceptions';
import { SessionService } from '@drag/session/session.service';
import { IS_PUBLIC_KEY } from '@drag/shared/decorators';
import { TokenService } from '@drag/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected readonly sessionService: SessionService,
    protected readonly tokenService: TokenService,
  ) {}

  private async verifySession(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { sessionId } = request.cookies;
    if (!sessionId) {
      return false;
    }
    try {
      const session = await this.sessionService.getSessionById(sessionId);
      request.userId = session.userAccountId;
      return true;
    } catch (error) {
      return false;
    }
  }

  private verifyToken(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization;
    try {
      const decrypted = this.tokenService.verifyToken(accessToken);
      request.userId = decrypted.userId;
      return true;
    } catch (error) {
      return false;
    }
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const isAuthorized = (await this.verifySession(context)) || this.verifyToken(context);
    if (!isAuthorized) {
      throw new AuthenticationException();
    }

    return true;
  }
}
