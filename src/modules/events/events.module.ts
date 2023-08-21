import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TokenModule } from '@modules/token/token.module';

import { EventEntity } from './entities/event.entity';
import { ParticipantEntity } from './entities/participant.entity';
import { QualificationEntity } from './entities/qualification.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [TokenModule, TypeOrmModule.forFeature([EventEntity, ParticipantEntity, QualificationEntity])],
  providers: [EventsService],
  exports: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
