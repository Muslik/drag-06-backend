import { Maybe } from '@sweet-monads/maybe';

import { UserWithSocialCredentialsDto } from '../dto/userWithSocialCredentials.dto';
import { UserAccountEntity } from '../entities/userAccount.entity';

export interface IUserService {
  createWithSocialCredentials: (user: UserWithSocialCredentialsDto) => Promise<UserAccountEntity>;
  getAll: <T extends keyof UserAccountEntity>(fields: T[]) => Promise<Pick<UserAccountEntity, T>[]>;
  getByEmail: <T extends keyof UserAccountEntity>(
    email: string,
    fields: T[],
  ) => Promise<Maybe<Pick<UserAccountEntity, T>>>;
  getById: <T extends keyof UserAccountEntity>(id: string, fields: T[]) => Promise<Maybe<Pick<UserAccountEntity, T>>>;
}
