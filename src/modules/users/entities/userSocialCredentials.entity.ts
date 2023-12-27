import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation, RelationId } from 'typeorm';

import { UserAccountEntity } from './userAccount.entity';

@Entity('user_social_credentials')
export class UserSocialCredentialsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  providerUserId: string;

  @Column()
  providerType: string;

  @ManyToOne('UserAccountEntity', (user: UserAccountEntity) => user.socialCredentials)
  userAccount: Relation<UserAccountEntity>;

  @RelationId((user: UserSocialCredentialsEntity) => user.userAccount)
  userAccountId: string;
}
