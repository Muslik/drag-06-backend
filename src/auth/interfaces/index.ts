import { ApiProperty } from '@nestjs/swagger';

export class JWTTokens {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
