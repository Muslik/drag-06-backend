import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('user_accounts')
export class UserAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: true,
    type: "varchar",
    length: 50,
  })
  firstName: string | null;

  @Column({
    nullable: true,
    type: "varchar",
    length: 50,
  })
  lastName: string | null;

  @Column({
    type: 'enum',
    enum: Sex,
    nullable: true,
  })
  sex?: Sex;

  @Column({
    nullable: true,
    type: "varchar",
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
    type: "varchar",
  })
  city: string | null;

  @Column({
    length: 20
  })
  avatarColor: string;

  @Column({
    unique: true,
    length: 255,
  })
  username: string;

  @Column({
    nullable: true,
    type: "varchar",
    length: 50,
  })
  phone: string | null;
}
