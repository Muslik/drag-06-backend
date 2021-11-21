import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Connection, QueryRunner, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { SessionEntity } from '@drag/session/entities/session.entity';
import { SessionUser } from '@drag/session/interfaces';
import { UserIdentity } from '@drag/shared/interfaces';
import { UserAccountEntity } from '@drag/users/entities';

const MAX_SESSIONS = 5;

@Injectable()
export class SessionService {
  constructor(
    private connection: Connection,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  private generateSessionId = () => {
    return crypto.createHash('sha256').update(uuid()).update(crypto.randomBytes(256)).digest('hex');
  };

  private static async getExcessSessions(userAccountId: string, queryRunner: QueryRunner) {
    const [sessions, sessionsCount] = await queryRunner.manager.findAndCount(SessionEntity, {
      userAccountId,
    });
    if (sessionsCount === MAX_SESSIONS) {
      return sessions;
    }
    return null;
  }

  async getSessionUserById(sessionId: string): Promise<SessionUser> {
    const {
      userAccount: { id, username, email, firstName, lastName },
    } = await this.sessionRepository.findOneOrFail({ sessionId }, { relations: ['userAccount'] });
    return { id, username, email, firstName, lastName };
  }

  async getSessionById(sessionId: string) {
    return this.sessionRepository.findOneOrFail({ sessionId });
  }

  async createSession(
    userAccount: UserAccountEntity,
    userIdentity: UserIdentity,
  ): Promise<{ sessionUser: SessionUser; sessionId: string }> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sessionId = this.generateSessionId();
      const session = queryRunner.manager.create(SessionEntity, {
        userAccountId: userAccount.id,
        sessionId,
        ...userIdentity,
      });
      const excessSessions = await SessionService.getExcessSessions(userAccount.id, queryRunner);
      if (excessSessions) {
        await queryRunner.manager.remove(excessSessions);
      }
      await queryRunner.manager.save(SessionEntity, session);
      await queryRunner.commitTransaction();
      return {
        sessionUser: {
          id: userAccount.id,
          username: userAccount.username,
          email: userAccount.email,
          firstName: userAccount.firstName,
          lastName: userAccount.lastName,
        },
        sessionId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  deleteSession(sessionId: string) {
    return this.sessionRepository.delete({ sessionId });
  }

  deleteAllSessions(userAccountId: string) {
    return this.sessionRepository.delete({ userAccountId });
  }
}
