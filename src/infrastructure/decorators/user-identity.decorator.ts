import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export type UserIdentity = { ip: string; userAgent: string };

function getIp(request: FastifyRequest): string {
  const xForwardedForHeader = request.headers['x-forwarded-for'];

  if (Array.isArray(xForwardedForHeader)) {
    return xForwardedForHeader[0];
  }

  if (xForwardedForHeader) {
    const forwardedIps = xForwardedForHeader.split(',');
    const clientIp = forwardedIps[0].trim();

    return clientIp;
  }

  // If x-forwarded-for header is not present, fallback to remoteAddress
  const remoteAddress = request.ip || request.connection.remoteAddress || 'unknown';

  return remoteAddress;
}

function getUserAgent(request: FastifyRequest): string {
  return request.headers['user-agent'] ?? 'unknown';
}

export const UserIdentity = createParamDecorator((_, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<FastifyRequest>();

  return { ip: getIp(request), userAgent: getUserAgent(request) };
});
