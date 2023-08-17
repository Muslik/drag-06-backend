import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as O from 'fp-ts/Option';

import { UserAccountEntity, UserSocialCredentialsEntity } from './entities';
import { UserWithSocialCredentials } from './interfaces';
import { generateAvatarColor } from './lib/generateAvatarColor';

@Injectable()
export class UsersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserAccountEntity)
    private readonly userAccountRepository: Repository<UserAccountEntity>,
    @InjectRepository(UserSocialCredentialsEntity)
    private readonly userSocialCredentialsRepository: Repository<UserSocialCredentialsEntity>,
  ) {}

  async createWithSocialCredentials({
    firstName,
    lastName,
    email,
    providerType,
    providerUserId,
  }: UserWithSocialCredentials): Promise<UserAccountEntity> {

    return this.dataSource.transaction(async (transactionEntityManager) => {
      const avatarColor = generateAvatarColor();

      const newUser = this.userAccountRepository.create({
        firstName,
        lastName,
        email,
        username: email,
        avatarColor,
      });

      const createdUser = await transactionEntityManager.save(newUser);

      const userSocialCredentials = this.userSocialCredentialsRepository.create({
        providerUserId,
        providerType,
        userAccount: createdUser,
      });
      await transactionEntityManager.save(userSocialCredentials);

      return createdUser;
    })
  }

  findAll(): Promise<UserAccountEntity[]> {
    return this.userAccountRepository.find();
  }

  async findById(id: string): Promise<O.Option<UserAccountEntity>> {
    const user = await this.userAccountRepository.findOne({ where: { id } });

    return O.fromNullable(user);
  }

  async findByEmail(email: string): Promise<O.Option<UserAccountEntity>> {
    const user = await this.userAccountRepository.findOne({ where: { email } });

    return O.fromNullable(user);
  }
}
