import { Column, Entity, Relation, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';

import { UserAccountEntity } from 'src/modules/user';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  refreshToken: string;

  @Column()
  userAgent: string;

  @Column()
  ip: string;

  @Column('bigint')
  expires: number;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @ManyToOne('UserAccountEntity', (userAccount: UserAccountEntity) => userAccount.refreshTokens)
  userAccount: Relation<UserAccountEntity>;

  @RelationId((refreshToken: RefreshTokenEntity) => refreshToken.userAccount)
  userAccountId: string;
}
