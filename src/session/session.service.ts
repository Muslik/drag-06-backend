import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { SessionUserDto } from '@drag/session/dto';
import { SessionEntity } from '@drag/session/entities/session.entity';
import { UserIdentity } from '@drag/shared/interfaces';
import { UserAccountEntity } from '@drag/users/entities';

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

  private static async getExcessSessions(userAccountId: string, queryRunner: QueryRunner) {
    const [sessions, sessionsCount] = await queryRunner.manager.findAndCount(SessionEntity, {
      where: { userAccountId },
    });
    if (sessionsCount === MAX_SESSIONS) {
      return sessions;
    }
    return null;
  }

  private serializeUerSession(userAccount: UserAccountEntity): SessionUserDto {
    const { id, username, email, firstName, lastName, avatarColor } = userAccount;
    return { id, username, email, firstName, lastName, avatarColor };
  }

  async getSessionUserById(sessionId: string): Promise<SessionUserDto> {
    const { userAccount } = await this.sessionRepository.findOneOrFail({
      where: { sessionId },
      relations: ['userAccount'],
    });
    return this.serializeUerSession(userAccount);
  }

  async getSessionById(sessionId: string) {
    return this.sessionRepository.findOneOrFail({ where: { sessionId } });
  }

  async createSession(
    userAccount: UserAccountEntity,
    userIdentity: UserIdentity,
  ): Promise<{ sessionUser: SessionUserDto; sessionId: string }> {
    const queryRunner = this.dataSource.createQueryRunner();

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
        sessionUser: this.serializeUerSession(userAccount),
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
