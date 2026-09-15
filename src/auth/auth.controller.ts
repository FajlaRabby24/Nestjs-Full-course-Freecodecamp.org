import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateResult } from 'typeorm';
import { CreateUserDTO } from '../users/dto/create-user.dto.js';
import { User } from '../users/user.entity.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ValidateTokenDto } from './dto/validate-token.dto.js';
import { JwtAuthGaurd } from './jwt-guard.js';
import { Enable2FAType, PayloadType } from './types.js';

export interface AuthenticatedRequest extends Request {
  user: PayloadType;
}
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({
    status: 201,
    description: 'It will return the user in the response',
  })
  signup(@Body() userDTO: CreateUserDTO): Promise<User> {
    return this.authService.signup(userDTO);
  }

  @Post('login')
  login(
    @Body() loginDto: LoginDto,
  ): Promise<
    { accessToken: string } | { validate2FA: string; message: string }
  > {
    return this.authService.login(loginDto);
  }

  @Get('disable-2fa')
  @UseGuards(JwtAuthGaurd)
  disable2FA(@Req() req: AuthenticatedRequest): Promise<UpdateResult> {
    return this.authService.disable2FA(req.user.userId);
  }

  @Get('enable-2fa')
  @UseGuards(JwtAuthGaurd)
  enable2FA(@Req() req: AuthenticatedRequest): Promise<Enable2FAType> {
    return this.authService.enable2FA(req.user.userId);
  }

  @Post('validate-2fa')
  @UseGuards(JwtAuthGaurd)
  validate2FA(
    @Req() req: AuthenticatedRequest,
    @Body() validateTokenDto: ValidateTokenDto,
  ): Promise<{ verified: boolean }> {
    return this.authService.validate2FAToken(
      req.user.userId,
      validateTokenDto.token,
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard('bearer'))
  getProfile(
    @Request()
    req: any,
  ) {
    delete req.user.password;
    return {
      msg: 'authenticated with api key',
      user: req.user,
    };
  }

  @Get('test')
  getEnv() {
    return this.authService.getEnv();
  }
}
