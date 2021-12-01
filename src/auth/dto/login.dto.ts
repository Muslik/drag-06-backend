import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginGoogleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}
