import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { CarClassEntity } from '@src/modules/references';
import { UserAccountEntity } from '@src/modules/users';

import { EventEntity } from './event.entity';
import { QualificationEntity } from './qualification.entity';

@Entity('participants')
export class ParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdDate: Date;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  firstName: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  lastName: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  region: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  phone: string | null;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  car: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 10,
  })
  startNumber: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  checkin: boolean;

  @ManyToOne(() => UserAccountEntity, {
    nullable: true,
  })
  userAccount: UserAccountEntity | null;

  @ManyToOne(() => CarClassEntity, {
    nullable: true,
    eager: true,
  })
  carClass: CarClassEntity | null;

  @ManyToOne(() => EventEntity, (event) => event.participants)
  event: EventEntity;

  @OneToOne(() => QualificationEntity, (qualification) => qualification.participant, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  qualification: QualificationEntity;
}
