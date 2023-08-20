import { BadRequestException } from '@nestjs/common';

export class RefreshTokenInvalidError extends BadRequestException {
  constructor() {
    super('TOKEN.REFRESH_TOKEN_IS_NOT_VALID', 'Invalid Token');
  }
}
