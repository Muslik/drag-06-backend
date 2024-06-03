import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { Tournament, TournamentStatus } from 'src/infrastructure/database';
import { BaseQueryDto } from 'src/infrastructure/dto';

const orderFields = ['createdAt', 'status', 'startDate'] satisfies (keyof Tournament)[];

export class TournamentQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(orderFields)
  'order[field]'?: (typeof orderFields)[number];

  @ApiProperty({
    enum: TournamentStatus,
  })
  @IsOptional()
  @IsEnum(TournamentStatus)
  'where[status]'?: TournamentStatus;
}
