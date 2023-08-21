import {
  AfterInsert,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventEntity } from './event.entity';
import { ParticipantEntity } from './participant.entity';

@Entity('qualification')
export class QualificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdDate: Date;

  @Column({
    nullable: true,
    type: 'float4',
  })
  firstRaceTime: number | null;

  @Column({
    nullable: true,
    type: 'float4',
  })
  secondRaceTime: number | null;

  @Column({
    nullable: true,
    type: 'float4',
  })
  thirdRaceTime: number | null;

  @Column({
    nullable: true,
    type: 'float4',
  })
  fourthRaceTime: number | null;

  @Column({
    nullable: true,
    type: 'float4',
  })
  bestRaceTime: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  disqualified: boolean;

  @OneToOne(() => ParticipantEntity, (participant) => participant.qualification)
  @JoinColumn()
  participant: ParticipantEntity;

  @ManyToOne(() => EventEntity, (event) => event.qualifications)
  event: EventEntity;

  @AfterInsert()
  @AfterUpdate()
  updateBestTime() {
    const times = [this.firstRaceTime, this.secondRaceTime, this.thirdRaceTime, this.fourthRaceTime];

    const nonNullableTimes = times.filter((time): time is NonNullable<number> => time != null);
    this.bestRaceTime = Math.min(...nonNullableTimes);
  }
}
