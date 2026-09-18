/**
 * ==============================================================================================
 * 🟢 STEP 4 of 11: PRISMA DATABASE SERVICE (LIFECYCLE HOOKS)
 * ==============================================================================================
 * This service manages the connection lifecycle to PostgreSQL.
 *
 * What happens here:
 *  4.1: Extends PrismaClient to inherit all auto-generated TypeScript queries (User, Room, Message).
 *  4.2: `onModuleInit()`: Connects to PostgreSQL automatically on application startup.
 *  4.3: `onModuleDestroy()`: Disconnects cleanly on server shutdown.
 *
 * 👉 PREVIOUS STEP: "prisma/schema/schema.prisma" (STEP 3 of 11)
 * 👉 NEXT STEP: Open "src/auth/auth.service.ts" (STEP 5 of 11) for JWT Handshake Authentication.
 * ==============================================================================================
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // 4.2: Connect to PostgreSQL on startup
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL via Prisma');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not connect to PostgreSQL: ${msg}. Ensure PostgreSQL is running on DATABASE_URL`);
    }
  }

  // 4.3: Disconnect cleanly on shutdown
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }
}
