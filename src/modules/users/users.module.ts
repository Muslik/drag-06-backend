import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';

import { UserAccountEntity } from './entities/userAccount.entity';
import { UserSocialCredentialsEntity } from './entities/userSocialCredentials.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccountEntity, UserSocialCredentialsEntity])],
  providers: [
    {
      provide: getRepositoryToken(UserSocialCredentialsEntity),
      useClass: UserSocialCredentialsEntity,
    },
    {
      provide: getRepositoryToken(UserAccountEntity),
      useClass: UserAccountEntity,
    },
    UsersService,
  ],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
