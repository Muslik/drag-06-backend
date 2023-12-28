import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserAccountEntity } from './entities/userAccount.entity';
import { UserSocialCredentialsEntity } from './entities/userSocialCredentials.entity';
import { UsersController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccountEntity, UserSocialCredentialsEntity])],
  providers: [Logger, UserService],
  controllers: [UsersController],
  exports: [UserService],
})
export class UsersModule {}
