import { ExtractTablesWithRelations } from 'drizzle-orm';
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core';

import { DrizzleService, schema } from '../database';

export class Paginated<T> {
  readonly count: number;
  readonly limit: number;
  readonly data: readonly T[];

  constructor(props: Paginated<T>) {
    this.count = props.count;
    this.limit = props.limit;
    this.data = props.data;
  }
}

export type OrderBy = { field: string; direction: 'asc' | 'desc' };

export type PaginatedQueryParams = {
  limit: number;
  offset: number;
  orderBy: OrderBy;
};

export type Tx = PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export interface IRepositoryBase {
  transaction<T>(callback: (tx: Tx) => Promise<T>): Promise<T>;
}

export abstract class RepositoryBase<T> implements IRepositoryBase {
  constructor(
    private readonly dataService: DrizzleService,
    public readonly schema: T,
  ) {}

  async transaction<T>(cb: (tx: Tx) => Promise<T>) {
    return this.dataService.db.transaction(cb);
  }
}
