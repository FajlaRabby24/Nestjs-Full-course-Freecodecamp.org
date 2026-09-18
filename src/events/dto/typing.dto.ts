import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TypingDto {
  @IsBoolean()
  @IsNotEmpty()
  isTyping: boolean;

  @IsString()
  @IsOptional()
  roomId?: string;

  @IsString()
  @IsOptional()
  recipientId?: string;
}
