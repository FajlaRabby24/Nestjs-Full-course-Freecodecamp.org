import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSongDto } from './dto/create-song-dto.js';
import { Song, SongDocument } from './schemas/song.js';

@Injectable()
export class SongsService {
  constructor(
    @InjectModel(Song.name)
    private readonly songModel: Model<SongDocument>,
  ) {}

  async createSong(createSongDto: CreateSongDto): Promise<Song> {
    const song = await this.songModel.create(createSongDto);
    return song;
  }
}
