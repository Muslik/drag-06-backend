import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from 'src/infrastructure/decorators';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('')
  @Public()
  async getUsers() {}
}
