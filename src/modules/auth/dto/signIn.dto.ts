import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum SignInProvider {
  GOOGLE = 'google',
}

export class SignInDto {
  @ApiProperty({ example: 'google-token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'google' })
  @IsEnum(SignInProvider)
  provider: SignInProvider;
}
