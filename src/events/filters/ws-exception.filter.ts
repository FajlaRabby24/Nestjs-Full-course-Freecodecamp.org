/**
 * ==============================================================================================
 * 🟢 STEP 7 of 11: WEBSOCKET EXCEPTION FILTER
 * ==============================================================================================
 * Catches WebSocket exceptions, HTTP exceptions, and validation errors.
 *
 * What happens here:
 *  7.1: Intercepts exceptions thrown during event execution or DTO validation.
 *  7.2: Emits a structured `{ event: 'exception', message, details }` event back to the client.
 *  7.3: Prevents unhandled errors from abruptly terminating the WebSocket connection.
 *
 * 👉 PREVIOUS STEP: "src/auth/ws-auth.guard.ts" (STEP 6 of 11)
 * 👉 NEXT STEP: Open "src/events/dto/send-message.dto.ts" (STEP 8 of 11) for DTO Validation.
 * ==============================================================================================
 */

import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException, HttpException, Error)
export class AllWsExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let message = 'An unexpected WebSocket error occurred';
    let details: any = null;

    if (exception instanceof WsException) {
      const error = exception.getError();
      message = typeof error === 'string' ? error : (error as any).message || message;
      details = typeof error === 'object' ? error : null;
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      details = typeof res === 'object' ? res : null;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Emit error event to client
    client.emit('exception', {
      status: 'error',
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
