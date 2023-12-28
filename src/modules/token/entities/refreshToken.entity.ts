import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  userAccountId: string;

  @ManyToOne(() => UserAccountEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  userAccount: UserAccountEntity;
}
