import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';

import { PermissionEntity } from './permission.entity';
import { UserAccountEntity } from './userAccount.entity';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    length: 255,
    type: 'varchar',
  })
  name: string;

  @Column({
    length: 255,
    type: 'varchar',
    nullable: true,
  })
  description: string | null;

  @ManyToMany('UserAccountEntity', (userAccount: UserAccountEntity) => userAccount.roles)
  userAccounts: Relation<UserAccountEntity[]>;

  @ManyToMany('PermissionEntity', (permission: PermissionEntity) => permission.roles)
  @JoinTable({
    name: 'roles_permissions',
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions: Relation<PermissionEntity[]>;
}
