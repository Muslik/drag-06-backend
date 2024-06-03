import { Maybe } from '@sweet-monads/maybe';

import { TournamentCreateDto } from './dto/createTournament.dto';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentQueryDto } from './dto/tournamentQuery.dto';

export interface ITournamentService {
  getLatestAvailableTournament: () => Promise<Maybe<TournamentDto>>;
  getTournaments: (query: TournamentQueryDto) => Promise<TournamentDto[]>;
  createTournament: (tournament: TournamentCreateDto) => Promise<TournamentDto>;
}
