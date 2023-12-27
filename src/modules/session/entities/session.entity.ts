import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Relation, RelationId } from 'typeorm';

import { UserAccountEntity } from 'src/modules/users';

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
  createdAt: Date;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  lastAccessAt: Date;

  @ManyToOne('UserAccountEntity', (user: UserAccountEntity) => user.sessions)
  userAccount: Relation<UserAccountEntity>;

  @RelationId((session: SessionEntity) => session.userAccount)
  userAccountId: string;
}
