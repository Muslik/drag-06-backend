import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Sex {
  UNKNOWN = 'unknown',
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('user_accounts')
export class UserAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: true,
    length: 50,
  })
  firstName: string;

  @Column({
    nullable: true,
    length: 50,
  })
  lastName: string;

  @Column({
    type: 'enum',
    enum: Sex,
    default: Sex.UNKNOWN,
  })
  sex: Sex;

  @Column({
    nullable: true,
    length: 255,
  })
  bio: string;

  @Column({
    unique: true,
    length: 255,
  })
  email: string;

  @Column({
    nullable: true,
  })
  city: string;

  @Column({
    unique: true,
    length: 255,
  })
  userName: string;

  @Column({
    nullable: true,
    length: 50,
  })
  phone: string;
}
