import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Injectable } from '@nestjs/common';
import { Maybe, fromNullable } from '@sweet-monads/maybe';

import { Tournament, TournamentCreate } from 'src/infrastructure/database';

import { TournamentQueryDto } from './dto/tournamentQuery.dto';

@Injectable()
export class TournamentRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {}

  async create(entity: TournamentCreate): Promise<Tournament> {
    return this.txHost.tx.tournament.create({ data: entity });
  }

  async findMany(query: TournamentQueryDto): Promise<Tournament[]> {
    const baseOrder = query['order[field]'] || 'createdAt';

    return this.txHost.tx.tournament.findMany({
      skip: query.skip,
      take: query.take,
      where: {
        status: query['where[status]'],
      },
      orderBy: {
        [baseOrder]: query['order[direction]'],
      },
    });
  }

  async findLatestActive(): Promise<Maybe<Tournament>> {
    return fromNullable(
      this.txHost.tx.tournament.findMany({
        where: {
          status: 'REGISTRATION',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      })[0],
    );
  }
}
