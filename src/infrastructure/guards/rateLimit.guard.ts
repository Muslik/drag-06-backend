import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { EXCEPTION_CODES, RateLimitException } from '../exceptions';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async throwThrottlingException() {
    throw new RateLimitException(`${EXCEPTION_CODES.TOO_MANY_REQUESTS}.RATE_LIMIT`, 'Too many requests');
  }
}
