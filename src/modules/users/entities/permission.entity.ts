import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

import { RoleEntity } from './role.entity';

@Entity('permissions')
export class PermissionEntity {
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
  })
  description: string;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];
}
