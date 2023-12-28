import { UnauthorizedException, BadRequestException } from 'src/infrastructure/exceptions';

export class InvalidTokenError extends BadRequestException {
  constructor() {
    super('AUTH.INVALID_GRANT', 'Token is not valid');
  }
}

export class UnauthorizedError extends UnauthorizedException {
  constructor() {
    super('AUTH.UNAUTHORIZED', 'Unauthorized');
  }
}

export class UnknownProviderError extends BadRequestException {
  constructor() {
    super('AUTH.UNKNOWN_PROVIDER', 'Unknown provider');
  }
}
