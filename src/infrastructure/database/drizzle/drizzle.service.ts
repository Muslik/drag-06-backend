import { Inject, Injectable } from '@nestjs/common';
import { DrizzleConfig } from 'drizzle-orm';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Client, ClientConfig, Pool, PoolConfig } from 'pg';

import { DRIZZLE_SERVICE } from '../database.contants';
import * as schema from './schema';

export type DrizzlePgConfig = {
  pg: {
    connection: 'client' | 'pool';
    config: ClientConfig | PoolConfig;
  };
  config?: DrizzleConfig<any>;
};

@Injectable()
export class DrizzleService {
  constructor(@Inject(DRIZZLE_SERVICE) readonly db: NodePgDatabase<typeof schema>) {}

  static async getDrizzle(options: DrizzlePgConfig) {
    if (options.pg.connection === 'client') {
      const client = new Client(options.pg.config);
      await client.connect();

      return drizzle(client, {
        schema,
        ...options.config,
      });
    }
    const pool = new Pool(options.pg.config);

    return drizzle(pool, {
      schema,
      ...options.config,
    });
  }
}
