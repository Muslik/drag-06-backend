import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Maybe, fromNullable } from '@sweet-monads/maybe';
import * as crypto from 'crypto';
import { Equal, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserIdentity } from 'src/infrastructure/decorators';

import { SessionEntity } from '../../entities/session.entity';
import { ISessionService } from './session.service.interface';

@Injectable()
export class SessionService implements ISessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  private generateSessionId = () => {
    return crypto.createHash('sha256').update(uuid()).update(crypto.randomBytes(256)).digest('hex');
  };

  async getSessionUserById(sessionId: string): Promise<Maybe<SessionEntity['userAccount']>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId: Equal(sessionId) },
      relations: ['userAccount'],
    });

    return fromNullable(session).map(({ userAccount }) => userAccount);
  }

  async getSessionById(sessionId: string): Promise<Maybe<Omit<SessionEntity, 'userAccount'>>> {
    const session = await this.sessionRepository.findOne({
      where: { sessionId: Equal(sessionId) },
    });

    if (session) {
      session.lastAccessAt = new Date();
      await this.sessionRepository.save(session);
    }

    return fromNullable(session);
  }

  async createSession(userId: string, userIdentity: UserIdentity): Promise<{ sessionId: string }> {
    const sessionId = this.generateSessionId();

    this.sessionRepository.save({
      userAccountId: userId,
      sessionId,
      ...userIdentity,
    });

    return {
      sessionId,
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({ sessionId: Equal(sessionId) });
  }

  async deleteAllSessions(userAccountId: string): Promise<void> {
    await this.sessionRepository.delete({ userAccountId: Equal(userAccountId) });
  }
}
