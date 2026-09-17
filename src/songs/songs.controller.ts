import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song-dto.js';
import { Song } from './schemas/song.js';
import { SongsService } from './songs.service.js';

@Controller('songs')
export class SongsController {
  constructor(private songService: SongsService) {}

  @Post()
  createSong(@Body() createSongDto: CreateSongDto) {
    return this.songService.createSong(createSongDto);
  }

  @Get()
  findAll(): Promise<Song[]> {
    return this.songService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Song> {
    return this.songService.findById(id);
  }
}
