import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokenModule } from '@drag/token/token.module';

import { UserAccountEntity, UserSocialCredentialsEntity } from './entities';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TokenModule,
    TypeOrmModule.forFeature([UserAccountEntity, UserSocialCredentialsEntity]),
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
