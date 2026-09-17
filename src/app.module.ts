import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SongsModule } from './songs/songs.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        `${process.env.NODE_ENV}.env`,
        '.env.development',
        '.env.production',
        '.env.local',
        '.env',
      ],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    SongsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
