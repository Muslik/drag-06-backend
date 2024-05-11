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

  async createWithSocialCredentials({
    firstName,
    lastName,
    email,
    providerType,
    providerUserId,
  }: UserWithSocialCredentialsDto): Promise<User> {
    return this.userRepository.transaction(async (tx) => {
      const avatarColor = generateAvatarColor();

      const [newUser] = await tx
        .insert(this.userRepository.schema)
        .values([
          {
            firstName,
            lastName,
            email,
            username: email,
            avatarColor,
          },
        ])
        .returning();

      await this.userSocialCredentialsRepository.insert([
        {
          providerUserId,
          providerType,
          userId: newUser.id,
        },
      ]);

      return newUser;
    });
  }

  async getByEmail(email: string): Promise<Maybe<User>> {
    return this.userRepository.findByEmail(email);
  }

  async getById(id: number): Promise<Maybe<User>> {
    return this.userRepository.findById(id);
  }
}
