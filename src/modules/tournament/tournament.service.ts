import { Inject, Injectable } from '@nestjs/common';
import { Maybe } from '@sweet-monads/maybe';

import { Tournament, TournamentCreate } from 'src/infrastructure/database';

import { TournamentCreateDto } from './dto/createTournament.dto';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentQueryDto } from './dto/tournamentQuery.dto';
import { ITournamentRepository } from './tournament.repository.interface';
import { ITournamentService } from './tournament.service.interface';

export const MAX_RACER_NUMBER = 99;

@Injectable()
export class TournamentService implements ITournamentService {
  constructor(@Inject('TOURNAMENT_REPOSITORY') private readonly tournamentRepository: ITournamentRepository) {}

  private toTournamentEntity(tournament: TournamentCreateDto): TournamentCreate;
  private toTournamentEntity(tournament: TournamentDto): Tournament;
  private toTournamentEntity(tournament: TournamentCreateDto | TournamentDto): Tournament | TournamentCreate {
    const { availableRacerNumbers, ...restTournament } = tournament;

    const availableRacerNumbersMask = Array.from({ length: MAX_RACER_NUMBER }, (_, i) =>
      availableRacerNumbers.includes(i + 1) ? '1' : '0',
    );

    return {
      ...restTournament,
      availableRacerNumbers: availableRacerNumbersMask.join(''),
    };
  }

  private toTournamentDto(tournament: Tournament): TournamentDto {
    const { availableRacerNumbers: availableRacerNumbersMask, ...restTournament } = tournament;

    const availableRacerNumbers = availableRacerNumbersMask
      .split('')
      .map((num, i) => (num === '1' ? i + 1 : null))
      .filter(Boolean);

    return {
      ...restTournament,
      availableRacerNumbers,
    };
  }

  async getLatestAvailableTournament(): Promise<Maybe<TournamentDto>> {
    const maybe = await this.tournamentRepository.findLatestActive();

    return maybe.map(this.toTournamentDto);
  }

  async getTournaments(query: TournamentQueryDto): Promise<TournamentDto[]> {
    const tournaments = await this.tournamentRepository.findMany(query);

    return tournaments.map(this.toTournamentDto);
  }

  async createTournament(tournament: TournamentCreateDto): Promise<TournamentDto> {
    const createdTournament = await this.tournamentRepository.create(this.toTournamentEntity(tournament));

    return this.toTournamentDto(createdTournament);
  }
}
