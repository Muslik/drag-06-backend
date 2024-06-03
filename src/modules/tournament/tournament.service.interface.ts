import { Maybe } from '@sweet-monads/maybe';

import { TournamentCreateDto } from './dto/createTournament.dto';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentQueryDto } from './dto/tournamentQuery.dto';

export interface ITournamentService {
  getTournaments: (query: TournamentQueryDto) => Promise<TournamentDto[]>;
  getTournamentById: (id: string) => Promise<Maybe<TournamentDto>>;
  createTournament: (tournament: TournamentCreateDto) => Promise<TournamentDto>;
}
