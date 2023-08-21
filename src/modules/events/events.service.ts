import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike } from 'typeorm';

import { CreateEventDto, EventQueryDto } from './dto';
import { EventEntity, EventStatus } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventsRepository: Repository<EventEntity>,
  ) {}

  async findAll({
    take = 10,
    skip = 0,
    order = 'eventDate',
    direction = 'DESC',
    search = '',
  }: EventQueryDto): Promise<EventEntity[]> {
    return this.eventsRepository.find({
      where: {
        name: ILike(`${search}%`),
      },
      take,
      skip,
      order: {
        [order]: direction,
      },
    });
  }

  async findActiveEvents({
    take = 10,
    skip = 0,
    order = 'eventDate',
    direction = 'DESC',
    search = '',
  }: EventQueryDto): Promise<EventEntity[]> {
    return this.eventsRepository.find({
      where: {
        eventStatus: Not(EventStatus.finished),
        name: ILike(`${search}%`),
      },
      take,
      skip,
      order: {
        [order]: direction,
      },
    });
  }

  async createEvent(event: CreateEventDto): Promise<EventEntity> {
    return this.eventsRepository.save(event);
  }
}
