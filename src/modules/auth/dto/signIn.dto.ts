import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export enum SignInProvider {
  GOOGLE = 'google',
  TELEGRAM = 'telegram',
}

export class SignInDtoGoogle {
  @ApiProperty({ example: 'google-token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiHideProperty()
  provider = SignInProvider.GOOGLE;
}

export class SignInDtoTelegram {
  @ApiProperty({ example: 12390809, type: 'number' })
  @Transform(({ value }) => value.toString())
  @IsString()
  userId: string;

  @ApiProperty({ example: '@Dzhabb' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'Dzhabb' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dzhabb' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiHideProperty()
  provider = SignInProvider.TELEGRAM;
}
