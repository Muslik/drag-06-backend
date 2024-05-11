import { Maybe } from '@sweet-monads/maybe';

import { User } from 'src/infrastructure/database';

import { UserWithSocialCredentialsDto } from '../dto/userWithSocialCredentials.dto';

export interface IUserService {
  createWithSocialCredentials: (user: UserWithSocialCredentialsDto) => Promise<User>;
  getByEmail: (email: string) => Promise<Maybe<User>>;
  getById: (id: number) => Promise<Maybe<User>>;
}
