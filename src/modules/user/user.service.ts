import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Maybe, fromNullable } from '@sweet-monads/maybe';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { UserWithSocialCredentialsDto } from './dto/userWithSocialCredentials.dto';
import { UserAccountEntity } from './entities/userAccount.entity';
import { UserSocialCredentialsEntity } from './entities/userSocialCredentials.entity';
import { IUserService } from './interfaces/user.service.interface';
import { generateAvatarColor } from './lib/generateAvatarColor';

@Injectable()
export class UserService implements IUserService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserAccountEntity)
    private readonly userAccountRepository: Repository<UserAccountEntity>,
    @InjectRepository(UserSocialCredentialsEntity)
    private readonly userSocialCredentialsRepository: Repository<UserSocialCredentialsEntity>,
    private readonly logger: Logger = new Logger(UserService.name),
  ) {}

  private logQuery(queryBuilder: SelectQueryBuilder<UserAccountEntity>): void {
    const query = queryBuilder.getQuery();
    this.logger.debug(`Executing query: ${query}`);
  }

  async createWithSocialCredentials({
    firstName,
    lastName,
    email,
    providerType,
    providerUserId,
  }: UserWithSocialCredentialsDto): Promise<UserAccountEntity> {
    return this.dataSource.transaction(async (transactionEntityManager) => {
      const avatarColor = generateAvatarColor();

      const newUser = this.userAccountRepository.create({
        firstName,
        lastName,
        email,
        username: email,
        avatarColor,
      });

      await transactionEntityManager.save(newUser);

      const userSocialCredentials = this.userSocialCredentialsRepository.create({
        providerUserId,
        providerType,
        userAccount: newUser,
      });
      await transactionEntityManager.save(userSocialCredentials);

      return newUser;
    });
  }

  getAll<T extends keyof UserAccountEntity>(fields: T[]): Promise<Pick<UserAccountEntity, T>[]> {
    const query = this.userAccountRepository.createQueryBuilder('user').select(fields.map((field) => `user.${field}`));

    this.logQuery(query);

    return query.getMany();
  }

  async getByEmail<T extends keyof UserAccountEntity>(
    email: string,
    fields: T[],
  ): Promise<Maybe<Pick<UserAccountEntity, T>>> {
    const query = this.userAccountRepository
      .createQueryBuilder('user')
      .select(fields.map((field) => `user.${field}`))
      .where('user.email = :email', { email });

    this.logQuery(query);

    return fromNullable(await query.getOne());
  }

  async getById<T extends keyof UserAccountEntity>(
    id: string,
    fields: T[] = Object.keys(UserAccountEntity) as T[],
  ): Promise<Maybe<Pick<UserAccountEntity, T>>> {
    const query = this.userAccountRepository
      .createQueryBuilder()
      .select(fields.map((field) => `user.${field}`))
      .where('user.id = :id', { id });

    this.logQuery(query);

    return fromNullable(await query.getOne());
  }
}
