import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from 'src/infrastructure/database';
import { IS_PUBLIC_KEY, ROLES_KEY } from 'src/infrastructure/decorators';

import { ForbiddenError } from '../auth.errors';

const CHILD_ROLES: Record<Role, Role[]> = {
  [Role.CREATOR]: [Role.CREATOR, Role.ADMIN, Role.MODERATOR, Role.USER],
  [Role.ADMIN]: [Role.ADMIN, Role.MODERATOR, Role.USER],
  [Role.MODERATOR]: [Role.MODERATOR, Role.USER],
  [Role.USER]: [Role.USER],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    const userRole = user.role as Role | undefined;

    if (!userRole) {
      throw new ForbiddenError();
    }

    const requiredChildRoles = CHILD_ROLES[userRole];

    const isAvailable = requiredChildRoles.some((child) => requiredRoles.includes(child));

    if (!isAvailable) {
      throw new ForbiddenError();
    }

    return true;
  }
}
