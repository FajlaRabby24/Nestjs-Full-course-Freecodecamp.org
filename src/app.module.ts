/**
 * ==============================================================================================
 * 🟢 STEP 2 of 11: ROOT APPLICATION MODULE
 * ==============================================================================================
 * This is the root module that wires all feature modules together.
 *
 * What happens here:
 *  2.1: PrismaModule -> Database service (PostgreSQL connection via Prisma ORM)
 *  2.2: AuthModule   -> JWT authentication, token generation, and WebSocket Guards
 *  2.3: EventsModule -> Socket.IO Gateway, event handlers, and persistence service
 *
 * 👉 PREVIOUS STEP: "src/main.ts" (STEP 1 of 11)
 * 👉 NEXT STEP: Open "prisma/schema/schema.prisma" (STEP 3 of 11) to inspect the database models.
 * ==============================================================================================
 */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EventsModule } from './events/events.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    PrismaModule, // Database Module (Global)
    AuthModule,   // Authentication Module (JWT + Guards)
    EventsModule, // Real-Time WebSocket Gateway & Service
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
