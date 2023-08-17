import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserAccountEntity } from '@modules/users/entities';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  userAgent: string;

  @Column()
  ip: string;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  lastAccessAt: string;

  @ManyToOne(() => UserAccountEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  userAccount: UserAccountEntity;

  @Column()
  userAccountId: string;
}
