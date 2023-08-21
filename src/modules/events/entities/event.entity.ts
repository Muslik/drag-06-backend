import Joi from 'joi';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ParticipantEntity } from './participant.entity';
import { QualificationEntity } from './qualification.entity';

export enum EventStatus {
  created = 'created',
  registration = 'registration',
  started = 'started',
  finished = 'finished',
}

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdDate: Date;

  @Column({
    nullable: false,
    type: 'timestamp',
  })
  eventDate: Date;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  name: string;

  @Column({
    nullable: true,
    type: 'varchar',
    length: 150,
  })
  description: string | null;

  @Column({
    type: 'enum',
    enum: EventStatus,
    nullable: false,
    default: EventStatus.created,
  })
  eventStatus: EventStatus;

  @OneToMany(() => QualificationEntity, (qualification) => qualification.event, {
    onDelete: 'CASCADE',
  })
  qualifications: QualificationEntity[];

  @OneToMany(() => ParticipantEntity, (participant) => participant.event, {
    onDelete: 'CASCADE',
  })
  participants: ParticipantEntity[];
}
