import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway.js';
import { EventsService } from './events.service.js';

@Module({
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
