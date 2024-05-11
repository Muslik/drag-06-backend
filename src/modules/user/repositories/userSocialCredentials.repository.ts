import { Injectable } from '@nestjs/common';

import {
  DrizzleService,
  UserSocialCredentials,
  UserSocialCredentialsSchema,
  schema,
} from 'src/infrastructure/database';
import { RepositoryBase } from 'src/infrastructure/ddd';

@Injectable()
export class UserSocialCredentialsRepository extends RepositoryBase<UserSocialCredentialsSchema> {
  constructor(private readonly drizzleService: DrizzleService) {
    super(drizzleService, schema.userSocialCredentials);
  }

  async insert(entity: UserSocialCredentialsSchema['$inferInsert'][]): Promise<UserSocialCredentials[]> {
    return await this.drizzleService.db.insert(this.schema).values(entity).returning();
  }
}
