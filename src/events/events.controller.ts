import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateEventDto } from './input/create-event.dto';
import { UpdateEventDto } from './input/update-event.dto';
import { Event } from './event.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { EventService } from './event.service';
import { ListEvents } from './input/list.events';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/user.entity';
import { AuthGuardLocal } from '../auth/auth-guard.local';
import { AuthGuardJwt } from '../auth/auth-guard.jwt';

@Controller('/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filter: ListEvents) {
    return await this.eventsService.getEventsWithAttendeeCountFilteredPaginated(
      filter,
      {
        total: true,
        currentPage: filter.page,
        limit: 2,
      },
    );
  }

  // @Get('practice2')
  // async practice2() {
  //   // return await this.repository.findOne({ where: { id: 1 } });
  //   const event = await this.repository.findOne({ where: { id: 1 } });
  //
  //   const attendee = new Attendee();
  //
  //   attendee.name = 'Jerry';
  //   attendee.event = event;
  //
  //   await this.attendeeRepository.save(attendee);
  //
  //   return event;
  // }

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
  @UseGuards(AuthGuardJwt)
  async create(@Body() input: CreateEventDto, @CurrentUser() user: User) {
    return await this.eventsService.createEvent(input, user);
  }

  @Patch(':id')
  @UseGuards(AuthGuardJwt)
  async update(
    @Param('id') id,
    @Body() input: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    const event = await this.eventsService.getEvent(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException('You are not the organizer of this event');
    }

    return await this.eventsService.updateEvent(event, input);
  }

  @Delete(':id')
  @UseGuards(AuthGuardJwt)
  @HttpCode(204)
  async remove(@Param('id') id, @CurrentUser() user: User) {
    const event = await this.eventsService.getEvent(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException('You are not the organizer of this event');
    }

    const result = await this.eventsService.deleteEvent(id);

    if (result?.affected === 0) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return result;
  }
}
