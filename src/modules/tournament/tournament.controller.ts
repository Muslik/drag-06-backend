import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { ApiErrorResponse, ApiValidationErrorResponse } from 'src/infrastructure/api/api-error.response';
import { Public } from 'src/infrastructure/decorators';

import { TournamentCreateDto } from './dto/createTournament.dto';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentQueryDto } from './dto/tournamentQuery.dto';
import { TOURNAMENT_SERVICE } from './tournament.constants';
import { ITournamentService } from './tournament.service.interface';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentController {
  constructor(@Inject(TOURNAMENT_SERVICE) private tournamentService: ITournamentService) {}

  @Public()
  @ApiOperation({ summary: 'Get all tournaments' })
  @ApiOkResponse({
    type: TournamentDto,
    description: 'Tournaments list',
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ApiErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Get('')
  async getTournaments(@Query() query: TournamentQueryDto): Promise<TournamentDto[]> {
    return this.tournamentService.getTournaments(query);
  }

  @Public()
  @ApiOperation({ summary: 'Get latest available tournament' })
  @ApiOkResponse({
    type: TournamentDto,
    description: 'Latest available tournament',
  })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ApiErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Get('latest-available')
  async getLatestAvailableTournament(): Promise<TournamentDto | null> {
    return this.tournamentService.getLatestAvailableTournament().then((maybe) =>
      maybe.fold(
        () => null,
        (value) => value,
      ),
    );
  }

  @Public()
  @ApiOperation({ summary: 'Create tournament' })
  @ApiCreatedResponse({
    type: TournamentDto,
    description: 'Return created tournament',
  })
  @ApiBadRequestResponse({ description: 'Bad request', type: ApiValidationErrorResponse })
  @ApiUnauthorizedResponse({ description: 'User not authorized', type: ApiErrorResponse })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post('')
  async createTournament(@Body() tournament: TournamentCreateDto): Promise<TournamentDto> {
    return this.tournamentService.createTournament(tournament);
  }
}
