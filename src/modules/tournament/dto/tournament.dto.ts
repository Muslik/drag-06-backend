import { ApiProperty } from '@nestjs/swagger';

import { TournamentStatus } from 'src/infrastructure/database';

import { TournamentCreateDto } from './createTournament.dto';

export class TournamentDto extends TournamentCreateDto {
  @ApiProperty({ example: 1 })
  id: number;

  description: string;

  status: TournamentStatus;
}
