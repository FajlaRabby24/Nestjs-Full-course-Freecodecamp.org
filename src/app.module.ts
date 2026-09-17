import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfiguration } from '../db/data-source.js';
import { validate } from '../env.validation.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArtistsModule } from './artists/artists.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DevConfigService } from './common/providers/DevConfigService.js';
import configuration from './config/configuration.js';
import { PlayListModule } from './playlists/playlists.module.js';
import { SeedModule } from './seed/seed.module.js';
import { SongsModule } from './songs/songs.module.js';
import { UsersModule } from './users/users.module.js';

const devConfig = {
  port: 3000,
};
const proConfig = {
  port: 5000,
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        `${process.cwd()}/.env.${process.env.NODE_ENV}`,
        `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}`,
        `${process.cwd()}/.env.development`,
        `${process.cwd()}/.env.local`,
        `${process.cwd()}/.env`,
      ],
      isGlobal: true,
      load: [configuration],
      validate: validate,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfiguration),
    PlayListModule,
    SongsModule,
    AuthModule,
    UsersModule,
    ArtistsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: DevConfigService,
      useClass: DevConfigService,
    },
    {
      provide: 'CONFIG',
      useFactory: () => {
        return process.env.NODE_ENV === 'development' ? devConfig : proConfig;
      },
    },
  ],
})
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     // consumer.apply(LoggerMiddleware).forRoutes('songs'); // * option 1
//     // consumer.apply(LoggerMiddleware).forRoutes({path: "songs", method: RequestMethod.POST}) // * option 2
//     consumer.apply(LoggerMiddleware).forRoutes(SongsController); // * option 3
//   }
// }
export class AppModule {}
