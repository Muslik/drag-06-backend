import { Injectable } from '@nestjs/common';
import { Maybe, fromNullable } from '@sweet-monads/maybe';
import { eq } from 'drizzle-orm';

import { DrizzleService, schema, RefreshTokensSchema, RefreshToken } from 'src/infrastructure/database';
import { RepositoryBase, Tx } from 'src/infrastructure/ddd';

@Injectable()
export class RefreshTokenRepository extends RepositoryBase<RefreshTokensSchema> {
  constructor(private readonly drizzleService: DrizzleService) {
    super(drizzleService, schema.refreshTokens);
  }

  async insert(entity: RefreshTokensSchema['$inferInsert'], tx?: Tx): Promise<RefreshToken> {
    const insert = tx ? tx.insert : this.drizzleService.db.insert;
    const [createdRecord] = await insert(this.schema).values(entity).returning();

    return createdRecord;
  }

  async deleteById(id: number, tx?: Tx): Promise<void> {
    const deleteQuery = tx ? tx.delete : this.drizzleService.db.delete;

    await deleteQuery(this.schema).where(eq(this.schema.id, id));
  }

  async findByToken(refreshToken: string): Promise<Maybe<RefreshToken>> {
    return fromNullable(
      await this.drizzleService.db.query.refreshTokens.findFirst({ where: eq(this.schema.token, refreshToken) }),
    );
  }
}
