import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DeleteResult, UpdateResult } from 'mongoose';
import { CreateSongDto } from './dto/create-song-dto.js';
import { UpdateSongDto } from './dto/update-song.dto.js';
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

  @Delete(':id')
  deleteSong(@Param('id') id: string): Promise<DeleteResult> {
    return this.songService.deleteSong(id);
  }

  @Patch(':id')
  updateSong(
    @Param('id') id: string,
    @Body() updateSongDto: UpdateSongDto,
  ): Promise<UpdateResult> {
    return this.songService.updateSong(id, updateSongDto);
  }
}
