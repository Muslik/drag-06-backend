import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator((_, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();

  return Number.parseInt(request.userId || '', 10);
});
