import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from 'src/infrastructure/decorators';

import { UserRepository } from './repositories/user.repository';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userRepository: UserRepository) {}

  @Get('')
  @Public()
  async getUsers() {
    return this.userRepository.findAll();
  }
}
