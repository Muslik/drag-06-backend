import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsNumber } from 'class-validator';

type SortDirection = 'asc' | 'desc';

const SortDirections: SortDirection[] = ['asc', 'desc'];

export class BasePaginationDto {
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  take?: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'number' }],
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  skip?: number;
}

export class BaseQueryDto extends BasePaginationDto {
  @ApiProperty({
    enum: SortDirections,
  })
  @IsOptional()
  @IsIn(SortDirections)
  'order[direction]'?: SortDirection;

  @ApiProperty({
    type: 'string',
  })
  @IsOptional()
  'order[field]'?: string;
}
