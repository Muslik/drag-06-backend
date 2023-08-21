import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('car_class')
export class CarClassEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  name: string;
}
