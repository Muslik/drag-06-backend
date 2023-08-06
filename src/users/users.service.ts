import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { generateRandomPaletteColor } from '@drag/shared/constants';

import { UserAccountEntity, UserSocialCredentialsEntity } from './entities';
import { UserWithSocialCredentials } from './interfaces';

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
  }: UserWithSocialCredentials) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const avatarColor = generateRandomPaletteColor();
      const newUser = this.userAccountRepository.create({
        firstName,
        lastName,
        email,
        username: email,
        avatarColor,
      });
      const createdUser = await queryRunner.manager.save(newUser);
      const userSocialCredentials = this.userSocialCredentialsRepository.create({
        providerUserId,
        providerType,
        userAccount: createdUser,
      });
      await queryRunner.manager.save(userSocialCredentials);
      await queryRunner.commitTransaction();
      return createdUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  findAll(): Promise<UserAccountEntity[]> {
    return this.userAccountRepository.find();
  }

  findById(id: string) {
    return this.userAccountRepository.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.userAccountRepository.findOne({ where: { email } });
  }
}
