import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Maybe, fromNullable } from '@sweet-monads/maybe';
import * as crypto from 'crypto';
import { Equal, DataSource, EntityManager, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserIdentity } from 'src/infrastructure/decorators';

import { SessionEntity } from '../../entities/session.entity';
import { ISessionService } from './session.service.interface';

const MAX_SESSIONS = 5;

@Injectable()
export class SessionService implements ISessionService {
  constructor(
    @Inject(DataSource) private dataSource: DataSource,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  private generateSessionId = () => {
    return crypto.createHash('sha256').update(uuid()).update(crypto.randomBytes(256)).digest('hex');
  };

  private async getExcessSessions(userId: string, manager: EntityManager) {
    const [sessions, sessionsCount] = await manager.findAndCount(SessionEntity, {
      where: { userAccountId: Equal(userId) },
    });
    if (sessionsCount === MAX_SESSIONS) {
      return sessions;
    }

    return null;
  }

  async getSessionUserById(sessionId: string): Promise<Maybe<SessionEntity['userAccount']>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId: Equal(sessionId) },
    });

    if (session) {
      session.lastAccessAt = new Date();
      await this.sessionRepository.save(session);
    }

    return fromNullable(session).map(({ userAccount }) => userAccount);
  }

  async getSessionById(sessionId: string): Promise<Maybe<Omit<SessionEntity, 'userAccount'>>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId: Equal(sessionId) },
    });

    return fromNullable(session);
  }

  async createSession(userId: string, userIdentity: UserIdentity): Promise<{ sessionId: string }> {
    return this.dataSource.transaction(async (transactionEntityManager) => {
      const sessionId = this.generateSessionId();
      const session = transactionEntityManager.create(SessionEntity, {
        userAccountId: userId,
        sessionId,
        ...userIdentity,
      });

      await transactionEntityManager.save(SessionEntity, session);

      const excessSessions = await this.getExcessSessions(userId, transactionEntityManager);
      if (excessSessions) {
        await transactionEntityManager.remove(excessSessions);
      }

      return {
        sessionId,
      };
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({ sessionId: Equal(sessionId) });
  }

  async deleteAllSessions(userAccountId: string): Promise<void> {
    await this.sessionRepository.delete({ userAccountId: Equal(userAccountId) });
  }
}
