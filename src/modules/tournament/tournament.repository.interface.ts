import { Maybe } from '@sweet-monads/maybe';

import { Tournament, TournamentCreate } from 'src/infrastructure/database';

import { TournamentQueryDto } from './dto/tournamentQuery.dto';

export interface ITournamentRepository {
  create(entity: TournamentCreate): Promise<Tournament>;
  findMany(query: TournamentQueryDto): Promise<Tournament[]>;
  findLatestActive(): Promise<Maybe<Tournament>>;
}
