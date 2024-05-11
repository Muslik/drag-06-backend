import { Injectable } from '@nestjs/common';
import { Maybe, fromNullable } from '@sweet-monads/maybe';
import { eq, desc, asc } from 'drizzle-orm';

import { DrizzleService, User, UserSchema, schema } from 'src/infrastructure/database';
import { Paginated, PaginatedQueryParams, RepositoryBase } from 'src/infrastructure/ddd';

@Injectable()
export class UserRepository extends RepositoryBase<UserSchema> {
  constructor(private readonly drizzleService: DrizzleService) {
    super(drizzleService, schema.users);
  }

  async findById(id: number): Promise<Maybe<User>> {
    return fromNullable(
      await this.drizzleService.db.query.users.findFirst({
        where: eq(this.schema.id, id),
      }),
    );
  }

  async findByEmail(email: string): Promise<Maybe<User>> {
    return fromNullable(
      await this.drizzleService.db.query.users.findFirst({
        where: eq(this.schema.email, email),
      }),
    );
  }

  async findAll(): Promise<User[]> {
    return await this.drizzleService.db.query.users.findMany();
  }

  async insert(entity: UserSchema['$inferInsert'][]): Promise<User[]> {
    return await this.drizzleService.db.insert(this.schema).values(entity).returning();
  }

  async deleteById(id: number): Promise<{ id: number }> {
    return await this.drizzleService.db.delete(this.schema).where(eq(this.schema.id, id)).returning({
      id: this.schema.id,
    })[0];
  }

  async findAllPaginated({
    limit,
    offset,
    orderBy: { direction, field },
  }: PaginatedQueryParams): Promise<Paginated<User>> {
    const orderByParameter = direction === 'asc' ? asc : desc;

    const data = await this.drizzleService.db.query.users.findMany({
      limit,
      offset,
      orderBy: [orderByParameter[field]],
    });

    return new Paginated({
      data,
      limit,
      count: data.length,
    });
  }
}
