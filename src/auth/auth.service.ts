import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { UpdateResult } from 'typeorm';
import { ArtistsService } from '../artists/artists.service.js';
import { CreateUserDTO } from '../users/dto/create-user.dto.js';
import { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Enable2FAType, PayloadType } from './types.js';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private artistsService: ArtistsService,
    private configService: ConfigService,
  ) {}

  //* signup
  signup(userDTO: CreateUserDTO): Promise<User> {
    return this.userService.create(userDTO);
  }

  // *login
  async login(
    loginDto: LoginDto,
  ): Promise<
    { accessToken: string } | { validate2FA: string; message: string }
  > {
    const user = await this.userService.findOne(loginDto.email); // 1.

    const passwordMatched = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException('Password does not match');
    }

    user.password = '';
    const payload: PayloadType = { email: user.email, userId: user.id };
    const artist = await this.artistsService.findArtist(user.id); // 2
    if (artist) {
      payload.artistId = artist.id;
    }
    if (user.enable2FA && user.twoFASecret) {
      //1.
      // sends the validateToken request link
      // else otherwise sends the json web token in the response
      return {
        //2.
        validate2FA: 'http://localhost:3000/auth/validate-2fa',
        message:
          'Please sends the one time password/token from your Google Authenticator App',
      };
    }
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async disable2FA(userId: number): Promise<UpdateResult> {
    return this.userService.disable2FA(userId);
  }

  //* enable 2FA
  async enable2FA(userId: number): Promise<Enable2FAType> {
    const user = await this.userService.findById(userId);
    if (user.enable2FA) {
      return { secret: user.twoFASecret };
    }

    const secret = speakeasy.generateSecret();
    console.log(secret);
    user.twoFASecret = secret.base32;
    await this.userService.updateSecretKey(user.id, user.twoFASecret);
    return { secret: user.twoFASecret };
  }

  async validate2FAToken(
    userId: number,
    token: string,
  ): Promise<{ verified: boolean }> {
    try {
      const user = await this.userService.findById(userId);
      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        token,
        encoding: 'base32',
      });

      return { verified: !!verified };
    } catch (error) {
      throw new UnauthorizedException('Error verifying token!');
    }
  }

  async validateUserByApiKey(apiKey: string): Promise<User | null> {
    const user = await this.userService.findByApiKey(apiKey);

    return user;
  }

  async getEnv() {
    return this.configService.get('PORT');
  }
}
