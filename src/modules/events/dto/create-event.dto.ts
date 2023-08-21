import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '@src/generated/i18n.generated';

export class CreateEventDto {
  @ApiProperty()
  @IsDateString({}, { message: i18nValidationMessage<I18nTranslations>('translations.validation.isDate') })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('translations.validation.isNotEmpty'),
  })
  eventDate: Date;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage<I18nTranslations>('translations.validation.isString') })
  @IsNotEmpty({
    message: i18nValidationMessage<I18nTranslations>('translations.validation.isNotEmpty'),
  })
  name: string;

  @ApiPropertyOptional()
  @IsString({ message: i18nValidationMessage<I18nTranslations>('translations.validation.isString') })
  @IsOptional({
    message: i18nValidationMessage<I18nTranslations>('translations.validation.isNotEmpty'),
  })
  description?: string;

  @ApiPropertyOptional({
    default: false,
  })
  @IsBoolean({ message: i18nValidationMessage<I18nTranslations>('translations.validation.isBoolean') })
  shouldStartRegistration: boolean;
}
