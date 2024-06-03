import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { Maybe, fromNullable } from '@sweet-monads/maybe';

import { User, UserCreate } from 'src/infrastructure/database';
import { Paginated, PaginatedQueryParams } from 'src/infrastructure/ddd';

@Injectable()
export class UserRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {}

  async findById(id: number): Promise<Maybe<User>> {
    return fromNullable(
      await this.txHost.tx.user.findFirst({
        where: {
          id,
        },
      }),
    );
  }

  async findByEmail(email: string): Promise<Maybe<User>> {
    return fromNullable(
      await this.txHost.tx.user.findFirst({
        where: { email },
      }),
    );
  }

  async findAll(): Promise<User[]> {
    return await this.txHost.tx.user.findMany();
  }

  async insert(entity: UserCreate): Promise<User> {
    return this.txHost.tx.user.create({ data: entity });
  }

  async deleteById(id: number): Promise<{ id: number }> {
    return this.txHost.tx.user.delete({
      where: { id },
      select: { id: true },
    });
  }

  async findAllPaginated({
    limit,
    offset,
    orderBy: { direction, field },
  }: PaginatedQueryParams): Promise<Paginated<User>> {
    const data = await this.txHost.tx.user.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        [field]: direction,
      },
    });

    return new Paginated({
      data,
      limit,
      count: data.length,
    });
  }
}
