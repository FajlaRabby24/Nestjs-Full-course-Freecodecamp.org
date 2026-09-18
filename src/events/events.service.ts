/**
 * ==============================================================================================
 * 🟢 STEP 9 of 11: WEBSOCKET DATABASE PERSISTENCE SERVICE
 * ==============================================================================================
 * Handles all PostgreSQL database queries and persistence for the WebSocket gateway.
 *
 * What happens here:
 *  9.1: `onModuleInit()`: Automatically seeds `#general`, `#tech-talk`, `#random` rooms on startup.
 *  9.2: `upsertUser()`: Ensures user records exist in DB before attaching message foreign keys.
 *  9.3: `saveMessage()`: Persists both public channel messages and 1-on-1 direct messages to DB.
 *  9.4: `getRoomHistory()`: Fetches past messages for a room ordered chronologically.
 *  9.5: `getDirectMessageHistory()`: Queries conversation history between two users.
 *
 * 👉 PREVIOUS STEP: "src/events/dto/send-message.dto.ts" (STEP 8 of 11)
 * 👉 NEXT STEP: Open "src/events/events.gateway.ts" (STEP 10 of 11) for the core WebSocket Gateway.
 * ==============================================================================================
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserPayload } from '../auth/auth.service.js';

export interface StoredMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  roomId?: string | null;
  recipientId?: string | null;
  createdAt: string;
}

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  // In-memory fallback buffer (ensures WebSocket works even before DB connection)
  private memoryMessages: StoredMessage[] = [];

  constructor(private readonly prisma: PrismaService) {}

  // 9.1: Auto-seed default rooms on startup
  async onModuleInit() {
    await this.seedDefaultData();
  }

  // 9.1.1: Seed rooms in PostgreSQL
  async seedDefaultData() {
    try {
      const defaultRooms = [
        { id: 'general', name: 'General Chat', description: 'Public discussion for everyone' },
        { id: 'tech-talk', name: 'Tech Talk', description: 'Architecture, NestJS, and WebSockets' },
        { id: 'random', name: 'Random', description: 'Off-topic banter and memes' },
      ];

      for (const r of defaultRooms) {
        await this.prisma.room.upsert({
          where: { name: r.name },
          update: {},
          create: {
            id: r.id,
            name: r.name,
            description: r.description,
          },
        });
      }
      this.logger.log('Default chat rooms seeded successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not seed rooms to DB: ${msg}. Using fallback.`);
    }
  }

  // 9.2: Upsert user to database
  async upsertUser(user: UserPayload) {
    try {
      return await this.prisma.user.upsert({
        where: { id: user.id },
        update: { username: user.username, email: user.email },
        create: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not persist user ${user.username} to DB: ${msg}`);
      return null;
    }
  }

  // 9.3: Save message to PostgreSQL (supports Room & Direct Messages)
  async saveMessage(params: {
    content: string;
    senderId: string;
    senderName: string;
    roomId?: string;
    recipientId?: string;
  }): Promise<StoredMessage> {
    const { content, senderId, senderName, roomId, recipientId } = params;

    const messageRecord: StoredMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      content,
      senderId,
      senderName,
      roomId: roomId || null,
      recipientId: recipientId || null,
      createdAt: new Date().toISOString(),
    };

    try {
      // Step 9.3.1: Ensure sender exists
      await this.prisma.user.upsert({
        where: { id: senderId },
        update: { username: senderName },
        create: { id: senderId, username: senderName, email: `${senderName.toLowerCase()}@chat.local` },
      });

      // Step 9.3.2: Ensure room exists if roomId provided
      if (roomId) {
        await this.prisma.room.upsert({
          where: { id: roomId },
          update: {},
          create: { id: roomId, name: roomId },
        });
      }

      // Step 9.3.3: Insert message into database
      const saved = await this.prisma.message.create({
        data: {
          id: messageRecord.id,
          content,
          senderId,
          roomId: roomId || null,
          recipientId: recipientId || null,
        },
        include: {
          sender: { select: { username: true } },
        },
      });

      return {
        id: saved.id,
        content: saved.content,
        senderId: saved.senderId,
        senderName: saved.sender.username,
        roomId: saved.roomId,
        recipientId: saved.recipientId,
        createdAt: saved.createdAt.toISOString(),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`PostgreSQL save error (${msg}). Stored in memory cache.`);
      this.memoryMessages.push(messageRecord);
      return messageRecord;
    }
  }

  // 9.4: Fetch past room message history
  async getRoomHistory(roomId: string, limit = 50): Promise<StoredMessage[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        include: {
          sender: { select: { username: true } },
        },
      });

      return messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.sender.username,
        roomId: m.roomId,
        recipientId: m.recipientId,
        createdAt: m.createdAt.toISOString(),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not fetch room history from DB: ${msg}. Returning in-memory history.`);
      return this.memoryMessages.filter((m) => m.roomId === roomId).slice(-limit);
    }
  }

  // 9.5: Fetch 1-on-1 direct message history
  async getDirectMessageHistory(user1Id: string, user2Id: string, limit = 50): Promise<StoredMessage[]> {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: user1Id, recipientId: user2Id },
            { senderId: user2Id, recipientId: user1Id },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        include: {
          sender: { select: { username: true } },
        },
      });

      return messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.sender.username,
        roomId: m.roomId,
        recipientId: m.recipientId,
        createdAt: m.createdAt.toISOString(),
      }));
    } catch {
      return this.memoryMessages
        .filter(
          (m) =>
            (m.senderId === user1Id && m.recipientId === user2Id) ||
            (m.senderId === user2Id && m.recipientId === user1Id),
        )
        .slice(-limit);
    }
  }
}
