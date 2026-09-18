/**
 * ==============================================================================================
 * 🟢 STEP 8 of 11: WEBSOCKET PAYLOAD VALIDATION DTO (DATA TRANSFER OBJECT)
 * ==============================================================================================
 * Defines the strict shape and validation rules for incoming 'send_message' events.
 *
 * What happens here:
 *  8.1: Validates that `content` is a non-empty string and does not exceed 1000 characters.
 *  8.2: Validates optional `roomId` (for public room messages) or `recipientId` (for 1-on-1 DMs).
 *
 * 👉 PREVIOUS STEP: "src/events/filters/ws-exception.filter.ts" (STEP 7 of 11)
 * 👉 RELATED DTOS: "src/events/dto/join-room.dto.ts", "src/events/dto/typing.dto.ts"
 * 👉 NEXT STEP: Open "src/events/events.service.ts" (STEP 9 of 11) for DB operations.
 * ==============================================================================================
 */

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  @MaxLength(1000, { message: 'Message content cannot exceed 1000 characters' })
  content: string;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  recipientId?: string;
}
