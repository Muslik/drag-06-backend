import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { Maybe } from '@sweet-monads/maybe';

import { User } from 'src/infrastructure/database';

import { UserWithSocialCredentialsDto } from './dto/userWithSocialCredentials.dto';
import { IUserService } from './interfaces/user.service.interface';
import { generateAvatarColor } from './lib/generateAvatarColor';
import { UserRepository } from './repositories/user.repository';
import { UserSocialCredentialsRepository } from './repositories/userSocialCredentials.repository';

@Injectable()
export class UserService implements IUserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userSocialCredentialsRepository: UserSocialCredentialsRepository,
  ) {}

  @Transactional()
  async createWithSocialCredentials({
    firstName,
    lastName,
    email,
    providerType,
    providerUserId,
  }: UserWithSocialCredentialsDto): Promise<User> {
    const avatarColor = generateAvatarColor();

    const newUser = await this.userRepository.insert({
      firstName,
      lastName,
      email,
      username: email,
      avatarColor,
    });

    await this.userSocialCredentialsRepository.insert({
      providerUserId,
      providerType,
      userId: newUser.id,
    });

    return newUser;
  }

  async getByEmail(email: string): Promise<Maybe<User>> {
    return this.userRepository.findByEmail(email);
  }

  async getById(id: number): Promise<Maybe<User>> {
    return this.userRepository.findById(id);
  }
}
