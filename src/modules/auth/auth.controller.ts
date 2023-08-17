import { Body, Controller, Post, Res } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { FastifyReply } from "fastify";

import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { ApiErrorResponse } from "@libs/api/api-error.response";
import { Cookies, Public, UserIdentity, UserId } from "@libs/decorators";

import { SESSION_ID } from "@modules/auth/constants";
import { AuthService, LoginGoogleDto } from "@modules/auth/index";
import { SessionUserDto } from "@modules/session/dto";
import { SessionService } from "@modules/session/session.service";
import { pipe } from "fp-ts/lib/function";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService
  ) {}

  @Public()
  @ApiOperation({ summary: "Auth with google oauth token" })
  @ApiCreatedResponse({
    description: "User successfully authorized",
    type: SessionUserDto,
  })
  @ApiBadRequestResponse({ description: "Bad request", type: ApiErrorResponse })
  @ApiInternalServerErrorResponse({ description: "Something went wrong" })
  @Post("login/google")
  async loginGoogle(
    @Body() loginDto: LoginGoogleDto,
    @Res({ passthrough: true }) response: FastifyReply,
    @UserIdentity() userIdentity: UserIdentity
  ) {
    return pipe(
      await this.authService.getOrCreateUserByGoogleToken(loginDto),
      TE.chain((user) =>
        TE.fromTask(() => this.sessionService.createSession(user, userIdentity))
      ),
      TE.match(
        (error) => {
          throw error;
        },
        ({ sessionUser, sessionId }) => {
          response.setCookie(SESSION_ID, sessionId, {
            path: "/",
          });

          return sessionUser;
        }
      )
    )();
  }

  @ApiOperation({ summary: "Read session token and return session user data" })
  @ApiCreatedResponse({ description: "Session exist", type: SessionUserDto })
  @ApiUnauthorizedResponse({
    description: "User not authorized",
    type: ApiErrorResponse,
  })
  @ApiInternalServerErrorResponse({ description: "Something went wrong" })
  @Post("session")
  async getSessionUser(@Cookies() { sessionId }: Record<string, string>) {
    return pipe(
      await this.sessionService.getSessionUserById(sessionId),
      O.fold(
        () => null,
        (data) => data
      )
    );
  }

  @ApiOperation({ summary: "Delete current session" })
  @ApiCreatedResponse({ description: "Session deleted" })
  @ApiUnauthorizedResponse({
    description: "User not authorized",
    type: ApiErrorResponse,
  })
  @ApiInternalServerErrorResponse({ description: "Something went wrong" })
  @Post("logout")
  async logout(
    @Res({ passthrough: true }) response: FastifyReply,
    @Cookies() { sessionId }: Record<string, string>
  ) {
    await this.sessionService.deleteSession(sessionId);
    response.clearCookie(SESSION_ID);
  }

  @ApiOperation({ summary: "Delete all sessions" })
  @ApiCreatedResponse({ description: "Sessions deleted" })
  @ApiUnauthorizedResponse({
    description: "User not authorized",
    type: ApiErrorResponse,
  })
  @ApiInternalServerErrorResponse({ description: "Something went wrong" })
  @Post("logout-all")
  async logoutAll(@UserId() userId: string) {
    return this.sessionService.deleteAllSessions(userId);
  }
}
