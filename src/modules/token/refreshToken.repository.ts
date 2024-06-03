import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { Maybe, fromNullable } from '@sweet-monads/maybe';

import { RefreshToken, RefreshTokenCreate } from 'src/infrastructure/database';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {}

  async insert(entity: RefreshTokenCreate): Promise<RefreshToken> {
    return this.txHost.tx.refreshToken.create({ data: entity });
  }

  async deleteById(id: number): Promise<void> {
    await this.txHost.tx.refreshToken.deleteMany({ where: { id } });
  }

  async findByToken(refreshToken: string): Promise<Maybe<RefreshToken>> {
    return this.txHost.tx.refreshToken.findFirst({ where: { token: refreshToken } }).then(fromNullable);
  }
}
