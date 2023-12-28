import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserAccountDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiPropertyOptional()
  sex: number | null;

  @ApiPropertyOptional()
  bio: string | null;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatarColor: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  city: string | null;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  firstName: string | null;

  @ApiPropertyOptional()
  lastName: string | null;
}

export class UserAccountShortDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  firstName: string | null;

  @ApiPropertyOptional()
  lastName: string | null;

  @ApiProperty()
  avatarColor: string;
}
