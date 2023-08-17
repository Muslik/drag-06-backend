import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";

import { IS_PUBLIC_KEY } from "@libs/decorators";

import { SessionService } from "@modules/session/session.service";
import { TokenService } from "@modules/token/token.service";

import { UnauthorizedError } from "../auth.errors";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected readonly sessionService: SessionService,
    protected readonly tokenService: TokenService
  ) {}

  private async getUserIdFromSessionId(
    sessionId: string
  ): Promise<O.Option<string>> {
    if (!sessionId) {
      return O.none;
    }

    return pipe(
      await this.sessionService.getSessionById(sessionId),
      O.map(({ userAccountId }) => userAccountId)
    );
  }

  private getUserIdFromAccessToken(accessToken: string): O.Option<string> {
    if (!accessToken) {
      return O.none;
    }

    return O.tryCatch(() => this.tokenService.verifyToken(accessToken).userId);
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

    return pipe(
      await this.getUserIdFromSessionId(cookieSessionId),
      O.fold(() => this.getUserIdFromAccessToken(headerAccessToken), O.some),
      O.fold(
        () => {
          throw new UnauthorizedError();
        },
        (userId) => {
          request.userId = userId;

          return true;
        }
      )
    );
  }
}
