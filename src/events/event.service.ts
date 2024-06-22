import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { AttendeeAnswerEnum } from './attendee.entity';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  public async getEvent(id: number): Promise<Event | undefined> {
    const query = this.getEventsWithAttendeeCountQuery()
      .andWhere('event.id = :id', { id });

    this.logger.debug(query.getSql());

    return await query.getOne();
  }

  public getEventsWithAttendeeCountQuery() {
    return this.getEventsBaseQuery()
      .loadRelationCountAndMap(
      'event.attendeeCount',
      'event.attendees',
      )
      .loadRelationCountAndMap(
        'event.attendeeAccepted',
        'event.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Accepted,
        }))
      .loadRelationCountAndMap(
        'event.attendeeMaybe',
        'event.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Maybe,
        }))
      .loadRelationCountAndMap(
        'event.attendeeRejected',
        'event.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Rejected,
        }))
  }

  private getEventsBaseQuery() {
    return this.eventsRepository
      .createQueryBuilder('event')
      .orderBy('event.id', 'DESC');
  }
}
