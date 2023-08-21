import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nTranslations } from '@src/generated/i18n.generated';
import { BaseQueryDto } from '@src/libs/dto';

import { EventEntity } from '../entities/event.entity';

type EventEntityKeys = keyof EventEntity;

type Order = EventEntityKeys;

const Order: Order[] = ['eventDate', 'name', 'eventStatus'];

export class EventQueryDto extends BaseQueryDto {
  @ApiProperty({
    enum: Order,
  })
  @IsIn(Order, { message: i18nValidationMessage<I18nTranslations>('translations.validation.isIn') })
  @IsOptional()
  order?: Order;

  @ApiProperty()
  @IsString({ message: i18nValidationMessage<I18nTranslations>('translations.validation.isString') })
  @IsOptional()
  search?: string;
}
