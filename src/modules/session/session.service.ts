import { Injectable } from '@nestjs/common';
import { Maybe } from '@sweet-monads/maybe';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';

import { Session, SessionWithUser } from 'src/infrastructure/database';
import { UserIdentity } from 'src/infrastructure/decorators';

import { SessionRepository } from './session.repository';
import { ISessionService } from './session.service.interface';

@Injectable()
export class SessionService implements ISessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  private generateSessionId = () => {
    return crypto.createHash('sha256').update(uuid()).update(crypto.randomBytes(256)).digest('hex');
  };

  async getSessionUserById(sessionId: string): Promise<Maybe<SessionWithUser>> {
    return this.sessionRepository.findSessionUserBySessionId(sessionId);
  }

  async getSessionById(sessionId: string): Promise<Maybe<Session>> {
    return this.sessionRepository.findBySessionId(sessionId);
  }

  async createSession(userId: number, userIdentity: UserIdentity): Promise<Session> {
    const sessionId = this.generateSessionId();

    return this.sessionRepository.insert({
      userId,
      sessionId,
      ...userIdentity,
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async deleteAllSessions(userId: number): Promise<void> {
    await this.sessionRepository.deleteAll(userId);
  }
}
