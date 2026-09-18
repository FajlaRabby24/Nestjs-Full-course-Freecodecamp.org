import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService, UserPayload } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('demo-users')
  getDemoUsers() {
    const users = this.authService.getDemoUsers();
    return users.map((user) => ({
      ...user,
      token: this.authService.generateToken(user),
    }));
  }

  @Post('login')
  login(@Body() body: { username: string; email: string }) {
    const user: UserPayload = {
      id: `user-${body.username.toLowerCase()}-${Date.now().toString(36)}`,
      username: body.username,
      email: body.email,
    };
    return {
      user,
      token: this.authService.generateToken(user),
    };
  }
}
