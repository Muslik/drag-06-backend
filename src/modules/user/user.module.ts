import { Logger, Module } from '@nestjs/common';

import { DatabaseModule } from 'src/infrastructure/database';

import { UserRepository } from './repositories/user.repository';
import { UserSocialCredentialsRepository } from './repositories/userSocialCredentials.repository';
import { USERS_SERVICE } from './user.constants';
import { UsersController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    Logger,
    {
      provide: USERS_SERVICE,
      useClass: UserService,
    },
    UserRepository,
    UserSocialCredentialsRepository,
  ],
  controllers: [UsersController],
  exports: [USERS_SERVICE],
})
export class UsersModule {}
