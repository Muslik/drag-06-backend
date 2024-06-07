import { TransactionHost, Transactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { Maybe, fromNullable } from '@sweet-monads/maybe';

import { Session, SessionCreate, SessionWithUser } from 'src/infrastructure/database';

import { ISessionRepository } from './session.repository.interface';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {}

  private async updateLastAccessAt<T extends Session>(entity: T): Promise<void> {
    entity.lastAccessAt = new Date();

    await this.update(entity);
  }

  async insert(entity: SessionCreate): Promise<Session> {
    return this.txHost.tx.session.create({ data: entity });
  }

  async update(entity: SessionCreate): Promise<Session> {
    return this.txHost.tx.session.update({
      where: {
        id: entity.id,
      },
      data: entity,
    });
  }

  async delete(sessionId: string): Promise<void> {
    await this.txHost.tx.session.delete({ where: { sessionId } });
  }

  async deleteAll(userId: number): Promise<void> {
    await this.txHost.tx.session.deleteMany({ where: { userId } });
  }

  @Transactional()
  async findBySessionId(sessionId: string): Promise<Maybe<Session>> {
    return this.txHost.tx.session
      .findFirst({ where: { sessionId } })
      .then(fromNullable)
      .then((maybeSession) => {
        return maybeSession.asyncMap(async (session) => {
          await this.updateLastAccessAt(session);

          return session;
        });
      });
  }

  async findSessionUserBySessionId(sessionId: string): Promise<Maybe<SessionWithUser>> {
    return this.txHost.tx.session
      .findFirst({ where: { sessionId }, include: { user: true } })
      .then(fromNullable)
      .then((maybeSession) =>
        maybeSession.asyncMap(async (sessionWithUser) => {
          const { user, ...session } = sessionWithUser;
          await this.updateLastAccessAt(session);

          return sessionWithUser;
        }),
      );
  }
}
