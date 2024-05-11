import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';

import { I18nTranslations } from 'src/i18n';
import { Public } from 'src/infrastructure/decorators';

import { UserRepository } from './repositories/user.repository';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  @Get('')
  @Public()
  async getUsers() {
    return this.userRepository.findAll();
  }
}
