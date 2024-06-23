import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post, Query,
  ValidationPipe
} from '@nestjs/common';
import { CreateEventDto } from './input/create-event.dto';
import { UpdateEventDto } from './input/update-event.dto';
import { Event } from './event.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { EventService } from './event.service';
import { ListEvents } from './input/list.events';

@Controller('/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
    // Borrar las injecciones de dependencias de arriba
    private readonly eventsService: EventService,
  ) {}

  @Get()
  async findAll(@Query() filter: ListEvents) {
    this.logger.log('Hit the findAll route');
    const events = await this.eventsService
      .getEventsWithAttendeeCountFiltered(filter);
    this.logger.debug(`Found ${events.length} events`);
    return events;
  }

  @Get('practice2')
  async practice2() {
    // return await this.repository.findOne({ where: { id: 1 } });
    const event = await this.repository.findOne({ where: { id: 1 } });

    const attendee = new Attendee();

    attendee.name = 'Jerry';
    attendee.event = event;
    
    await this.attendeeRepository.save(attendee);
    
    return event;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // console.log(typeof id);
    // const event = await this.repository.findOne({ where: { id } });
    const event = await this.eventsService.getEvent(id);
    
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return event;
  }

  @Post()
  async create(@Body(ValidationPipe) input: CreateEventDto) {
    return await this.repository.save({
      ...input,
      when: new Date(input.when),
    });
  }

  @Patch(':id')
  async update(@Param('id') id, @Body() input: UpdateEventDto) {
    const event = await this.repository.findOne(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return await this.repository.save({
      ...event,
      ...input,
      when: input.when ? new Date(input.when) : event.when,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id) {
    const event = await this.repository.findOne(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.repository.delete(event);
  }
}
