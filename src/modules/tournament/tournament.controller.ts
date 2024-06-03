import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { ApiErrorResponse, ApiValidationErrorResponse } from 'src/infrastructure/api/api-error.response';
import { Public } from 'src/infrastructure/decorators';
import { RateLimitException } from 'src/infrastructure/exceptions';

import { TournamentCreateDto } from './dto/createTournament.dto';
import { TournamentDto } from './dto/tournament.dto';
import { TournamentQueryDto } from './dto/tournamentQuery.dto';
import { TOURNAMENT_SERVICE } from './tournament.constants';
import { ITournamentService } from './tournament.service.interface';

@ApiTags('tournaments')
@Controller('tournaments')
@ApiTooManyRequestsResponse({ type: RateLimitException, status: 429, description: 'Too many requests' })
@ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
@ApiUnauthorizedResponse({ description: 'User not authorized', type: ApiErrorResponse })
export class TournamentController {
  constructor(@Inject(TOURNAMENT_SERVICE) private tournamentService: ITournamentService) {}

  @Public()
  @ApiOperation({ summary: 'Get all tournaments' })
  @ApiOkResponse({
    type: TournamentDto,
    description: 'Tournaments list',
    isArray: true,
  })
  @Get('')
  async getTournaments(@Query() query: TournamentQueryDto): Promise<TournamentDto[]> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    return this.tournamentService.getTournaments(query);
  }

  @Public()
  @ApiOperation({ summary: 'Get tournament by id' })
  @ApiOkResponse({
    type: TournamentDto,
    description: 'Tournament',
  })
  @Get(':id')
  async getTournamentById(@Param('id') id: string): Promise<TournamentDto | null> {
    return this.tournamentService.getTournamentById(id).then((maybe) =>
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
  @Post('')
  async createTournament(@Body() tournament: TournamentCreateDto): Promise<TournamentDto> {
    return this.tournamentService.createTournament(tournament);
  }
}
