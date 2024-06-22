import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  public async getEvent(id: number): Promise<Event | undefined> {
    const query = this.getEventsBaseQuery()
      .andWhere('event.id = :id', { id });

    this.logger.debug(query.getSql());

    return await query.getOne();
  }

  private getEventsBaseQuery() {
    return this.eventsRepository
      .createQueryBuilder('event')
      .orderBy('event.id', 'DESC');
  }
}
