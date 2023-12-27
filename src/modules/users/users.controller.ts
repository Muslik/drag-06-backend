import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/infrastructure/decorators';
import { BadRequestException } from 'src/infrastructure/exceptions';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Post('roles')
  async createRole() {}
}
