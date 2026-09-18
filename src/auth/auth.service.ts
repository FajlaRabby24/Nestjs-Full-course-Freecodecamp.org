/**
 * ==============================================================================================
 * 🟢 STEP 5 of 11: AUTHENTICATION SERVICE (JWT ISSUANCE & VERIFICATION)
 * ==============================================================================================
 * This service handles security for WebSocket connections:
 *
 * What happens here:
 *  5.1: `generateToken(user)`: Signs a JWT payload containing user ID, username, and email.
 *  5.2: `verifyToken(token)`: Decodes and verifies incoming JWT tokens from WebSocket handshakes.
 *  5.3: `getDemoUsers()`: Returns pre-configured demo users (Alice, Bob, Charlie) for easy multi-tab testing.
 *
 * 👉 PREVIOUS STEP: "src/prisma/prisma.service.ts" (STEP 4 of 11)
 * 👉 NEXT STEP: Open "src/auth/ws-auth.guard.ts" (STEP 6 of 11) for the WebSocket Guard.
 * ==============================================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface UserPayload {
  id: string;
  username: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  // 5.1: Generate JWT token for socket handshake
  generateToken(user: UserPayload): string {
    return this.jwtService.sign(user);
  }

  // 5.2: Verify JWT token received in socket handshake
  verifyToken(token: string): UserPayload | null {
    try {
      return this.jwtService.verify<UserPayload>(token);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Invalid or expired WebSocket token: ${errorMsg}`);
      return null;
    }
  }

  // 5.3: Pre-configured mock demo users for quick testing
  getDemoUsers(): UserPayload[] {
    return [
      { id: 'user-alice-uuid-001', username: 'Alice', email: 'alice@example.com' },
      { id: 'user-bob-uuid-002', username: 'Bob', email: 'bob@example.com' },
      { id: 'user-charlie-uuid-003', username: 'Charlie', email: 'charlie@example.com' },
    ];
  }
}
