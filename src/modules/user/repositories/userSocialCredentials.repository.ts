import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';

import { UserSocialCredentials, UserSocialCredentialsCreate } from 'src/infrastructure/database';
import { RepositoryBase } from 'src/infrastructure/ddd';

@Injectable()
export class UserSocialCredentialsRepository extends RepositoryBase {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  async insert(entity: UserSocialCredentialsCreate): Promise<UserSocialCredentials> {
    return await this.txHost.tx.userSocialCredentials.create({ data: entity });
  }
}
