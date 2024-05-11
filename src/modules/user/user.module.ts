import { Logger, Module } from '@nestjs/common';

import { DatabaseModule } from 'src/infrastructure/database';

import { UserRepository } from './repositories/user.repository';
import { UserSocialCredentialsRepository } from './repositories/userSocialCredentials.repository';
import { UsersController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DatabaseModule],
  providers: [Logger, UserService, UserRepository, UserSocialCredentialsRepository],
  controllers: [UsersController],
  exports: [UserService],
})
export class UsersModule {}
