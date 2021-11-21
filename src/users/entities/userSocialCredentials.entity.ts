import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserAccountEntity } from './userAccount.entity';

@Entity('user_social_credentials')
export class UserSocialCredentialsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  providerUserId: string;

  @Column({ unique: true })
  providerType: string;

  @Column()
  userAccountId: string;

  @OneToOne(() => UserAccountEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  userAccount: UserAccountEntity;
}
