/**
 * ==============================================================================================
 * 🟢 STEP 6 of 11: WEBSOCKET AUTHENTICATION GUARD
 * ==============================================================================================
 * This guard protects sensitive WebSocket message handlers (e.g. @SubscribeMessage('send_message')).
 *
 * What happens here:
 *  6.1: Intercepts incoming WebSocket event context via `context.switchToWs().getClient()`.
 *  6.2: Checks if `client.data.user` exists (which was attached during handshake connection).
 *  6.3: Throws `WsException` if unauthenticated, preventing unauthorized event execution.
 *
 * 👉 PREVIOUS STEP: "src/auth/auth.service.ts" (STEP 5 of 11)
 * 👉 NEXT STEP: Open "src/events/filters/ws-exception.filter.ts" (STEP 7 of 11) for Exception Handling.
 * ==============================================================================================
 */

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 6.1: Switch execution context to WebSocket
    const client: Socket = context.switchToWs().getClient();

    // 6.2: Read authenticated user session attached during handleConnection()
    const user = client.data?.user;

    // 6.3: Reject if user is not authenticated
    if (!user) {
      throw new WsException('Unauthorized: WebSocket client is not authenticated.');
    }

    // 6.4: Allow event handler to execute
    return true;
  }
}
