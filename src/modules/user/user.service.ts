import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { Maybe } from '@sweet-monads/maybe';
import { generateFromEmail, generateUsername } from 'unique-username-generator';

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

  private prepareUsername(email: string, username: string): string {
    if (email) {
      return generateFromEmail(email, 5);
    }
    if (username) {
      return username;
    }

    return generateUsername('-', 0, 15);
  }

  @Transactional()
  async createWithSocialCredentials({
    firstName,
    lastName,
    email,
    username,
    providerType,
    providerUserId,
  }: UserWithSocialCredentialsDto): Promise<User> {
    const avatarColor = generateAvatarColor();

    const preparedUsername = this.prepareUsername(email, username);

    const finalUserName = await this.userRepository.findByUsername(preparedUsername).then((maybe) =>
      maybe.fold(
        () => preparedUsername,
        () => generateUsername('-', 0, 20),
      ),
    );

    const newUser = await this.userRepository.insert({
      firstName,
      lastName,
      email,
      username: finalUserName,
      avatarColor,
    });

    await this.userSocialCredentialsRepository.insert({
      providerUserId,
      providerType,
      userId: newUser.id,
    });

    return newUser;
  }

  async getByProviderUserId(providerUserId: string): Promise<Maybe<User>> {
    return this.userRepository.findByProviderUserId(providerUserId);
  }

  async getByEmail(email: string): Promise<Maybe<User>> {
    return this.userRepository.findByEmail(email);
  }

  async getById(id: number): Promise<Maybe<User>> {
    return this.userRepository.findById(id);
  }
}
