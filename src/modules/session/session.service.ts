import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as crypto from "crypto";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import { DataSource, DeleteResult, EntityManager, Repository } from "typeorm";
import { v4 as uuid } from "uuid";

import { UserIdentity } from "@src/libs/types/userIndentity";

import { SessionEntity, SessionUserDto } from "@modules/session";
import { UserAccountEntity } from "@modules/users/entities";

const MAX_SESSIONS = 5;

@Injectable()
export class SessionService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>
  ) {}

  private generateSessionId = () => {
    return crypto
      .createHash("sha256")
      .update(uuid())
      .update(crypto.randomBytes(256))
      .digest("hex");
  };

  private static async getExcessSessions(
    userAccountId: string,
    manager: EntityManager
  ) {
    const [sessions, sessionsCount] = await manager.findAndCount(
      SessionEntity,
      {
        where: { userAccountId },
      }
    );
    if (sessionsCount === MAX_SESSIONS) {
      return sessions;
    }

    return null;
  }

  private serializeUserSession(userAccount: UserAccountEntity): SessionUserDto {
    const { id, username, email, firstName, lastName, avatarColor } =
      userAccount;

    return { id, username, email, firstName, lastName, avatarColor };
  }

  async getSessionUserById(
    sessionId: string
  ): Promise<O.Option<SessionUserDto>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
      relations: ["userAccount"],
    });

    return pipe(
      O.fromNullable(session),
      O.map(({ userAccount }) => this.serializeUserSession(userAccount))
    );
  }

  async getSessionById(sessionId: string): Promise<O.Option<SessionEntity>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
    });

    return O.fromNullable(session);
  }

  async createSession(
    userAccount: UserAccountEntity,
    userIdentity: UserIdentity
  ): Promise<{ sessionUser: SessionUserDto; sessionId: string }> {
    return this.dataSource.transaction(async (transactionEntityManager) => {
      const sessionId = this.generateSessionId();
      const session = transactionEntityManager.create(SessionEntity, {
        userAccountId: userAccount.id,
        sessionId,
        ...userIdentity,
      });
      const excessSessions = await SessionService.getExcessSessions(
        userAccount.id,
        transactionEntityManager
      );
      if (excessSessions) {
        await transactionEntityManager.remove(excessSessions);
      }
      await transactionEntityManager.save(SessionEntity, session);

      return {
        sessionUser: this.serializeUserSession(userAccount),
        sessionId,
      };
    });
  }

  deleteSession(sessionId: string): Promise<DeleteResult> {
    return this.sessionRepository.delete({ sessionId });
  }

  deleteAllSessions(userAccountId: string): Promise<DeleteResult> {
    return this.sessionRepository.delete({ userAccountId });
  }
}