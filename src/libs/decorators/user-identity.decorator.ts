import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export type UserIdentity = { ip: string; userAgent: string };

export const UserIdentity = createParamDecorator((_, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<FastifyRequest>();

  return { ip: request.ip, userAgent: request.headers['user-agent'] };
});
