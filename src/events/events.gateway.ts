/**
 * ==============================================================================================
 * 🟢 STEP 10 of 11: CORE WEBSOCKET GATEWAY (THE MAIN REAL-TIME CONTROLLER)
 * ==============================================================================================
 * This is the central heart of the WebSocket server. It connects all the previous pieces:
 *
 * What happens here:
 *  10.1: `afterInit()`: Server starts and initializes Socket.IO.
 *  10.2: `handleConnection()`: Authenticates client handshake JWT, joins personal `user:<id>` room,
 *        and announces user online.
 *  10.3: `handleDisconnect()`: Cleans up user presence and announces user offline.
 *  10.4: `@SubscribeMessage('join_room')`: User joins channel (#general), loads history, and broadcasts to room.
 *  10.5: `@SubscribeMessage('leave_room')`: User leaves channel.
 *  10.6: `@SubscribeMessage('send_message')`: Validated & guarded event that persists message to DB
 *        and routes it to either a public room or 1-on-1 private direct recipient with an Ack callback.
 *  10.7: `@SubscribeMessage('typing')`: Broadcasts typing indicators ("Alice is typing...").
 *  10.8: `@SubscribeMessage('get_online_users')`: Returns active connected users list.
 *  10.9: `@SubscribeMessage('get_dm_history')`: Returns 1-on-1 DM history from PostgreSQL.
 *
 * 👉 PREVIOUS STEP: "src/events/events.service.ts" (STEP 9 of 11)
 * 👉 NEXT STEP: Open "client/index.html" (STEP 11 of 11) to see the frontend client implementation.
 * ==============================================================================================
 */

import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService, UserPayload } from '../auth/auth.service.js';
import { WsAuthGuard } from '../auth/ws-auth.guard.js';
import { JoinRoomDto } from './dto/join-room.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { TypingDto } from './dto/typing.dto.js';
import { EventsService } from './events.service.js';
import { AllWsExceptionsFilter } from './filters/ws-exception.filter.js';

// Apply global WebSocket Exception Filter to catch errors gracefully without crashing the socket
@UseFilters(new AllWsExceptionsFilter())
@WebSocketGateway({
  cors: {
    origin: '*', // Allows clients from any origin to connect
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // Global Socket.IO Server Instance injected by NestJS
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  // In-memory registry to track online users: Map<UserId, { user, Set of active socket IDs }>
  private onlineUsers = new Map<string, { user: UserPayload; socketIds: Set<string> }>();

  constructor(
    private readonly eventsService: EventsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 10.1: LIFECYCLE HOOK: afterInit()
   */
  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket Gateway initialized with Socket.IO!');
  }

  /**
   * 10.2: LIFECYCLE HOOK: handleConnection(client: Socket)
   * Handles JWT handshake auth, user session setup, and online presence.
   */
  async handleConnection(client: Socket) {
    try {
      // 10.2.1: Extract token from handshake auth
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization?.replace('Bearer ', '') as string) ||
        (client.handshake.query?.token as string);

      let user: UserPayload | null = null;

      // 10.2.2: Verify JWT token
      if (token) {
        user = this.authService.verifyToken(token);
      }

      // Fallback guest user for quick testing if no token provided
      if (!user) {
        const username = (client.handshake.query?.username as string) || `Guest-${client.id.substring(0, 4)}`;
        user = {
          id: `guest-${client.id}`,
          username,
          email: `${username.toLowerCase()}@example.com`,
        };
      }

      // 10.2.3: Attach user payload to socket session data
      client.data.user = user;

      // 10.2.4: Join personal room (e.g., 'user:user-alice-uuid-001') for 1-on-1 private DMs
      await client.join(`user:${user.id}`);

      // 10.2.5: Track online presence
      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, { user, socketIds: new Set([client.id]) });
        // Broadcast to all connected clients that this user is online
        this.server.emit('user_online', {
          userId: user.id,
          username: user.username,
          onlineAt: new Date().toISOString(),
        });
      } else {
        // Multi-tab support: user opened another tab
        this.onlineUsers.get(user.id)!.socketIds.add(client.id);
      }

      // Sync user to PostgreSQL database
      await this.eventsService.upsertUser(user);

      this.logger.log(`🟢 User connected: ${user.username} (Socket: ${client.id}) | Online Users: ${this.onlineUsers.size}`);

      // 10.2.6: Send confirmation and online users list back to connecting client
      client.emit('connection_success', {
        message: 'Successfully connected and authenticated to WebSocket server',
        user,
        onlineUsers: this.getOnlineUsersList(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Connection error for socket ${client.id}: ${errorMsg}`);
      client.disconnect();
    }
  }

  /**
   * 10.3: LIFECYCLE HOOK: handleDisconnect(client: Socket)
   * Cleans up socket presence and notifies other clients.
   */
  handleDisconnect(client: Socket) {
    const user: UserPayload = client.data.user;

    if (user && this.onlineUsers.has(user.id)) {
      const entry = this.onlineUsers.get(user.id)!;
      entry.socketIds.delete(client.id);

      // Only mark user as offline if all their connections/tabs are closed
      if (entry.socketIds.size === 0) {
        this.onlineUsers.delete(user.id);
        // Broadcast offline status to everyone
        this.server.emit('user_offline', {
          userId: user.id,
          username: user.username,
          offlineAt: new Date().toISOString(),
        });
      }
    }

    this.logger.log(`🔴 User disconnected: ${user?.username || client.id} | Online Users: ${this.onlineUsers.size}`);
  }

  /**
   * 10.4: EVENT HANDLER: 'join_room'
   * Allows a user to join a channel and receive past message history.
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const user: UserPayload = client.data.user;

    // 10.4.1: Join room channel
    await client.join(dto.roomId);
    this.logger.log(`📥 ${user.username} joined room: #${dto.roomId}`);

    // 10.4.2: Fetch past messages from PostgreSQL
    const history = await this.eventsService.getRoomHistory(dto.roomId);

    // 10.4.3: Broadcast to other room members (excluding sender)
    client.to(dto.roomId).emit('user_joined_room', {
      user,
      roomId: dto.roomId,
      joinedAt: new Date().toISOString(),
    });

    // 10.4.4: Return Acknowledgement with loaded history
    return {
      status: 'success',
      roomId: dto.roomId,
      message: `Joined room #${dto.roomId}`,
      history,
    };
  }

  /**
   * 10.5: EVENT HANDLER: 'leave_room'
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const user: UserPayload = client.data.user;
    await client.leave(dto.roomId);

    this.logger.log(`📤 ${user.username} left room: #${dto.roomId}`);

    // Notify other members
    client.to(dto.roomId).emit('user_left_room', {
      user,
      roomId: dto.roomId,
      leftAt: new Date().toISOString(),
    });

    return {
      status: 'success',
      roomId: dto.roomId,
      message: `Left room #${dto.roomId}`,
    };
  }

  /**
   * 10.6: EVENT HANDLER: 'send_message' (Core Messaging Flow)
   * Protected with WsAuthGuard, validated with SendMessageDto, and persisted to DB.
   */
  @UseGuards(WsAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const sender: UserPayload = client.data.user;

    // 10.6.1: Persist message to PostgreSQL database via Prisma
    const savedMessage = await this.eventsService.saveMessage({
      content: dto.content,
      senderId: sender.id,
      senderName: sender.username,
      roomId: dto.roomId,
      recipientId: dto.recipientId,
    });

    // 10.6.2: Smart Routing
    if (dto.roomId) {
      // Case A: Group Room -> Emit to everyone in the channel
      this.server.to(dto.roomId).emit('new_message', savedMessage);
    } else if (dto.recipientId) {
      // Case B: 1-on-1 Direct Message -> Emit to recipient's private room & sender's client
      this.server.to(`user:${dto.recipientId}`).emit('new_direct_message', savedMessage);
      client.emit('new_direct_message', savedMessage);
    } else {
      // Case C: Fallback global broadcast
      this.server.emit('new_message', savedMessage);
    }

    // 10.6.3: Return Delivery Confirmation (Ack) to sender
    return {
      status: 'delivered',
      messageId: savedMessage.id,
      timestamp: savedMessage.createdAt,
    };
  }

  /**
   * 10.7: EVENT HANDLER: 'typing' (Real-Time Typing Indicators)
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TypingDto,
  ) {
    const user: UserPayload = client.data.user;

    if (dto.roomId) {
      // Broadcast to room members EXCEPT the person typing
      client.to(dto.roomId).emit('user_typing', {
        user,
        roomId: dto.roomId,
        isTyping: dto.isTyping,
      });
    } else if (dto.recipientId) {
      // Broadcast to specific direct message recipient
      this.server.to(`user:${dto.recipientId}`).emit('user_typing', {
        user,
        recipientId: dto.recipientId,
        isTyping: dto.isTyping,
      });
    }
  }

  /**
   * 10.8: EVENT HANDLER: 'get_online_users'
   */
  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(): WsResponse<UserPayload[]> {
    return {
      event: 'online_users',
      data: this.getOnlineUsersList(),
    };
  }

  /**
   * 10.9: EVENT HANDLER: 'get_dm_history'
   */
  @SubscribeMessage('get_dm_history')
  async handleGetDmHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { recipientId: string },
  ) {
    const sender: UserPayload = client.data.user;
    const history = await this.eventsService.getDirectMessageHistory(sender.id, body.recipientId);
    return {
      status: 'success',
      recipientId: body.recipientId,
      history,
    };
  }

  // Helper to get online users array
  private getOnlineUsersList(): UserPayload[] {
    return Array.from(this.onlineUsers.values()).map((entry) => entry.user);
  }
}
