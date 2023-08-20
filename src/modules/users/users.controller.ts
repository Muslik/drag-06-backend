import { Controller, Get } from '@nestjs/common';

import { Public } from '@src/libs/decorators';
import { BadRequestException } from '@src/libs/exceptions';

@Controller('users')
@Public()
export class UsersController {
  @Get()
  getUsers() {
    return new BadRequestException('EXCEPTION', 'SORRY');
  }
}
