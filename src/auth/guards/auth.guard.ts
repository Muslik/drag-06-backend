import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthenticationException } from '@drag/exceptions';
import { IS_PUBLIC_KEY } from '@drag/shared/decorators';
import { TokenService } from '@drag/token/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(protected reflector: Reflector, protected readonly tokenService: TokenService) {}

  private verifyToken(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization;
    try {
      const decrypted = this.tokenService.verifyToken(accessToken);
      request.userId = decrypted.userId;
      return true;
    } catch (error) {
      throw new AuthenticationException();
    }
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return this.verifyToken(context);
  }
}
