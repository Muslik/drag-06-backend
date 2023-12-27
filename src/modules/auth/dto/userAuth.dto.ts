import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserAuthDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'johny' })
  username: string;

  @ApiProperty({ example: 'johny76@gmail.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName: string | null;

  @ApiProperty({ example: '#ffffff' })
  avatarColor: string;
}
