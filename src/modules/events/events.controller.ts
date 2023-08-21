import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiErrorResponse, ApiValidationErrorResponse } from '@src/libs/api/api-error.response';
import { Public } from '@src/libs/decorators';

import { CreateEventDto, EventQueryDto } from './dto';
import { EventEntity } from './entities/event.entity';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @ApiOperation({ summary: 'Get all events' })
  @ApiOkResponse({
    description: 'Return all events',
    type: EventEntity,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Get()
  async getEvents(@Query() query: EventQueryDto) {
    return this.eventsService.findAll(query);
  }

  @Public()
  @ApiOperation({ summary: 'Get all active events' })
  @ApiOkResponse({
    description: 'Return all active events',
    type: EventEntity,
    isArray: true,
  })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Get('active')
  async getActiveEvents(@Query() query: EventQueryDto) {
    return this.eventsService.findActiveEvents(query);
  }

  @Public()
  @ApiOperation({ summary: 'Create new event' })
  @ApiCreatedResponse({
    description: 'Event created',
    type: EventEntity,
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ApiValidationErrorResponse,
  })
  @ApiInternalServerErrorResponse({ description: 'Something went wrong', type: ApiErrorResponse })
  @Post()
  async createEvent(@Body() event: CreateEventDto) {
    return this.eventsService.createEvent(event);
  }

  async deleteEvent() {}

  async editEvent() {}
}
