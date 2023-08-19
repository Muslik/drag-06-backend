import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = new Logger('HTTP');

  use(request: FastifyRequest, response: FastifyReply['raw'], next: () => void): void {
    const { method, ip, headers } = request;
    this.logger.debug(`[REQUEST]: ${method}, ${headers['user-agent']}, ${ip}`);

    response.on('finish', () => {
      const { statusCode } = response;
      this.logger.debug(`[RESPONSE]: ${method} ${statusCode} ${ip}`);
    });

    next();
  }
}
