import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Maybe, fromNullable } from '@sweet-monads/maybe';
import * as crypto from 'crypto';
import { Equal, DataSource, DeleteResult, EntityManager, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserIdentity } from '@src/libs/types/userIndentity';

import { SessionEntity, SessionUserDto } from '@modules/session';
import { UserAccountEntity } from '@modules/users/entities';

const MAX_SESSIONS = 5;

@Injectable()
export class SessionService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  private generateSessionId = () => {
    return crypto.createHash('sha256').update(uuid()).update(crypto.randomBytes(256)).digest('hex');
  };

  private static async getExcessSessions(userAccountId: string, manager: EntityManager) {
    const [sessions, sessionsCount] = await manager.findAndCount(SessionEntity, {
      where: { userAccountId: Equal(userAccountId) },
    });
    if (sessionsCount === MAX_SESSIONS) {
      return sessions;
    }

    return null;
  }

  private serializeUserSession(userAccount: UserAccountEntity): SessionUserDto {
    const { id, username, email, firstName, lastName, avatarColor } = userAccount;

    return { id, username, email, firstName, lastName, avatarColor };
  }

  async getSessionUserById(sessionId: string): Promise<Maybe<SessionUserDto>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId: Equal(sessionId) },
      relations: ['userAccount'],
    });

    return fromNullable(session).map(({ userAccount }) => this.serializeUserSession(userAccount));
  }

  async getSessionById(sessionId: string): Promise<Maybe<SessionEntity>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId: Equal(sessionId) },
    });

    return fromNullable(session);
  }

  async createSession(
    userAccount: UserAccountEntity,
    userIdentity: UserIdentity,
  ): Promise<{ sessionUser: SessionUserDto; sessionId: string }> {
    return this.dataSource.transaction(async (transactionEntityManager) => {
      const sessionId = this.generateSessionId();
      const session = transactionEntityManager.create(SessionEntity, {
        userAccountId: userAccount.id,
        sessionId,
        ...userIdentity,
      });
      const excessSessions = await SessionService.getExcessSessions(userAccount.id, transactionEntityManager);
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
    return this.sessionRepository.delete({ sessionId: Equal(sessionId) });
  }

  deleteAllSessions(userAccountId: string): Promise<DeleteResult> {
    return this.sessionRepository.delete({ userAccountId: Equal(userAccountId) });
  }
}
