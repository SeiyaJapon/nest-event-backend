import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { AttendeeAnswerEnum } from './attendee.entity';
import { ListEvents, WhenEventFilter } from './input/list.events';
import { paginate, PaginateOptions } from '../pagination/paginator';
import { CreateEventDto } from './input/create-event.dto';
import { User } from '../auth/user.entity';
import { Event } from './event.entity';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  private async getEventsWithAttendeeCountFiltered(filter?: ListEvents) {
    let query = this.getEventsWithAttendeeCountQuery();

    if (!filter) {
      return await query;
    }

    if (filter.when) {
      if (Number(filter.when.valueOf()) === WhenEventFilter.Today) {
        query = query.andWhere(
          `event.when >= CURDATE() AND event.when <= CURDATE() + INTERVAL 1 DAY`,
        );
      }
    }

    if (filter.when) {
      if (Number(filter.when.valueOf()) === WhenEventFilter.Tomorrow) {
        query = query.andWhere(
          `event.when >= CURDATE() AND event.when <= CURDATE() + INTERVAL 1 DAY`,
        );
      }
    }

    if (filter.when) {
      if (Number(filter.when.valueOf()) === WhenEventFilter.ThisWeek) {
        query = query.andWhere(
          'YEARWEEK(event.when, 1) = YEARWEEK(CURDATE(), 1)',
        );
      }
    }

    if (filter.when) {
      if (Number(filter.when.valueOf()) === WhenEventFilter.NextWeek) {
        query = query.andWhere(
          'YEARWEEK(event.when, 1) = YEARWEEK(CURDATE(), 1) + 1',
        );
      }
    }

    return query;
  }

  public async getEventsWithAttendeeCountFilteredPaginated(
    filter: ListEvents,
    paginateOptions: PaginateOptions,
  ) {
    return await paginate(
      await this.getEventsWithAttendeeCountFiltered(filter),
      paginateOptions,
    );
  }

  public async getEvent(id: number): Promise<Event | undefined> {
    const query = this.getEventsWithAttendeeCountQuery().andWhere(
      'event.id = :id',
      { id },
    );

    this.logger.debug(query.getSql());

    return await query.getOne();
  }

  public async createEvent(input: CreateEventDto, user: User): Promise<Event> {
    return await this.eventsRepository.save({
      ...input,
      organizer: user,
      when: new Date(input.when),
    });
  }
  
  public getEventsWithAttendeeCountQuery() {
    return this.getEventsBaseQuery()
      .loadRelationCountAndMap('event.attendeeCount', 'event.attendees')
      .loadRelationCountAndMap(
        'event.attendeeAccepted',
        'event.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Accepted,
          }),
      )
      .loadRelationCountAndMap(
        'event.attendeeMaybe',
        'event.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Maybe,
          }),
      )
      .loadRelationCountAndMap(
        'event.attendeeRejected',
        'event.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Rejected,
          }),
      );
  }

  public async deleteEvent(id: number): Promise<DeleteResult> {
    return await this.eventsRepository
      .createQueryBuilder('event')
      .delete()
      .where('event.id = :id', { id })
      .execute();
  }

  private getEventsBaseQuery() {
    return this.eventsRepository
      .createQueryBuilder('event')
      .orderBy('event.id', 'DESC');
  }
}
