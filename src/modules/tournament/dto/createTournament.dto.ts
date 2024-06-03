import { ApiProperty } from '@nestjs/swagger';
import { TournamentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsNumber,
  IsArray,
  ArrayMinSize,
  IsEnum,
  Min,
  IsInt,
  Max,
  MaxLength,
} from 'class-validator';

import { MAX_RACER_NUMBER } from '../tournament.service';

export class TournamentCreateDto {
  @ApiProperty({ example: 'Турнир по дрег рейсингу 3й этап' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Турнир пройдет дома' })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  description?: string;

  @ApiProperty({ example: '2021-10-10T10:00:00.000Z' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  fee: number;

  @ApiProperty({ example: [1, 2, 3, 4, 5] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(MAX_RACER_NUMBER, { each: true })
  availableRacerNumbers: number[];

  @ApiProperty({ example: 'CREATED', enum: TournamentStatus })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
