import { Injectable } from '@nestjs/common';
import { Maybe, fromNullable } from '@sweet-monads/maybe';
import { eq } from 'drizzle-orm';

import { DrizzleService, SessionSchema, Session, schema, SessionWithUserAccount } from 'src/infrastructure/database';
import { RepositoryBase, Tx } from 'src/infrastructure/ddd';

@Injectable()
export class SessionRepository extends RepositoryBase<SessionSchema> {
  constructor(private readonly drizzleService: DrizzleService) {
    super(drizzleService, schema.sessions);
  }

  private async updateLastAccessAt<T extends Session>(entity: T, tx?: Tx): Promise<void> {
    entity.lastAccessAt = new Date();

    await this.update(entity, tx);
  }

  async insert(entity: SessionSchema['$inferInsert']): Promise<Session> {
    const [createdRecord] = await this.drizzleService.db.insert(this.schema).values(entity).returning();

    return createdRecord;
  }

  async update<T extends Session>(entity: PartialWithId<T>, tx?: Tx): Promise<Session> {
    const updateQuery = tx ? tx.update(this.schema) : this.drizzleService.db.update(this.schema);

    const [updatedRecord] = await updateQuery.set(entity).where(eq(this.schema.id, entity.id)).returning();

    return updatedRecord;
  }

  async delete(sessionId: string): Promise<void> {
    await this.drizzleService.db.delete(this.schema).where(eq(this.schema.sessionId, sessionId));
  }

  async deleteAll(userId: number): Promise<void> {
    await this.drizzleService.db.delete(this.schema).where(eq(this.schema.userId, userId));
  }

  async findBySessionId(sessionId: string, tx?: Tx): Promise<Maybe<Session>> {
    const query = tx ? tx.query : this.drizzleService.db.query;

    return query.sessions
      .findFirst({ where: eq(this.schema.sessionId, sessionId) })
      .then(fromNullable)
      .then((maybeSession) =>
        maybeSession.asyncMap(async (session) => {
          await this.updateLastAccessAt(session, tx);

          return session;
        }),
      );
  }

  async findSessionUserBySessionId(sessionId: string, tx?: Tx): Promise<Maybe<SessionWithUserAccount>> {
    const query = tx ? tx.query : this.drizzleService.db.query;

    return query.sessions
      .findFirst({ where: eq(this.schema.sessionId, sessionId), with: { user: true } })
      .then(fromNullable)
      .then((maybeSession) =>
        maybeSession.asyncMap(async (session) => {
          await this.updateLastAccessAt(session, tx);

          return session;
        }),
      );
  }
}
