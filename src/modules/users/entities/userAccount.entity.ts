import { SessionEntity } from 'src/modules/session';
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';

import { RoleEntity } from './role.entity';
import { UserSocialCredentialsEntity } from './userSocialCredentials.entity';

@Entity('user_accounts')
export class UserAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  firstName: string | null;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  lastName: string | null;

  @Column({
    type: 'int2',
    nullable: true,
  })
  sex: number | null;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  bio: string | null;

  @Column({
    unique: true,
    length: 255,
  })
  email: string;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  city: string | null;

  @Column({
    length: 20,
  })
  avatarColor: string;

  @Column({
    unique: true,
    length: 255,
  })
  username: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  phone: string | null;

  @OneToMany('UserSocialCredentialsEntity', (socialCredentials: UserSocialCredentialsEntity) => socialCredentials.userAccount)
  socialCredentials: Relation<UserSocialCredentialsEntity[]>;

  @OneToMany('SessionEntity', (session: SessionEntity) => session.userAccount)
  sessions: Relation<SessionEntity[]>;

  @ManyToMany('RoleEntity', (role: RoleEntity) => role.userAccounts)
  @JoinTable({
    name: 'user_accounts_roles',
    joinColumn: {
      name: 'user_account_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: Relation<RoleEntity[]>;
}
