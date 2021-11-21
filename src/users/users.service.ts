import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';

import { UserAccountEntity, UserSocialCredentialsEntity } from './entities';
import { UserWithSocialCredentials } from './interfaces';

@Injectable()
export class UsersService {
  constructor(
    private connection: Connection,
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
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newUser = this.userAccountRepository.create({
        firstName,
        lastName,
        email,
        username: email,
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
    return this.userAccountRepository.findOne(id);
  }

  findByEmail(email: string) {
    return this.userAccountRepository.findOne({ email });
  }
}
