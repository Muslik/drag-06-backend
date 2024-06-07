import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Role } from 'src/infrastructure/database';

export class UserAuthDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'johny' })
  username: string;

  @ApiProperty({ example: 'johny76@gmail.com' })
  email: string | null;

  @ApiPropertyOptional({ example: 'John' })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName: string | null;

  @ApiProperty({ example: '#ffffff' })
  avatarColor: string;

  @ApiProperty({ example: Role.USER })
  role: Role;
}
