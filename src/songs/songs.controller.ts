import { Body, Controller, Post } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song-dto.js';
import { SongsService } from './songs.service.js';

@Controller('songs')
export class SongsController {
  constructor(private songService: SongsService) {}

  @Post()
  createSong(@Body() createSongDto: CreateSongDto) {
    return this.songService.createSong(createSongDto);
  }
}
