import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsNumberString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from 'src/i18n';

type SortDirection = 'ASC' | 'DESC';

const SortDirections: SortDirection[] = ['ASC', 'DESC'];

export class BasePaginationDto {
  @ApiProperty({ type: 'string' })
  @IsNumberString({}, { message: i18nValidationMessage<I18nTranslations>('translations.validation.isNumber') })
  @IsOptional()
  @Transform((propertyone) => Number(propertyone))
  take?: number;

  @ApiProperty({ type: 'string' })
  @IsNumberString({}, { message: i18nValidationMessage<I18nTranslations>('translations.validation.isNumber') })
  @IsOptional()
  @Transform((propertyone) => Number(propertyone))
  skip?: number;
}

export class BaseQueryDto extends BasePaginationDto {
  @ApiProperty({
    enum: SortDirections,
  })
  @IsIn(SortDirections, { message: i18nValidationMessage<I18nTranslations>('translations.validation.isIn') })
  @IsOptional()
  direction?: SortDirection;
}
