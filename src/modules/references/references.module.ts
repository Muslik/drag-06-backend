import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CarClassEntity } from './entities/car-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarClassEntity])],
})
export class ReferencesModule {}
