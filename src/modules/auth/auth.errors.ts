import { UnauthorizedException } from 'src/libs/exceptions';

export class InvalidTokenError extends UnauthorizedException {
  constructor() {
    super('AUTH.INVALID_GRANT', 'Token is not valid');
  }
}

export class UnauthorizedError extends UnauthorizedException {
  constructor() {
    super('AUTH.UNAUTHORIZED', 'Unauthorized');
  }
}
