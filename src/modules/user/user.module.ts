import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';

import { UserAccountEntity } from './entities/userAccount.entity';
import { UserSocialCredentialsEntity } from './entities/userSocialCredentials.entity';
import { UsersController } from './user.controller';
import { UserService } from './user.service';

@Module({
  providers: [
    {
      provide: getRepositoryToken(UserSocialCredentialsEntity),
      useClass: UserSocialCredentialsEntity,
    },
    {
      provide: getRepositoryToken(UserAccountEntity),
      useClass: UserAccountEntity,
    },
    UserService,
  ],
  controllers: [UsersController],
  exports: [UserService],
})
export class UsersModule {}
