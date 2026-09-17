import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
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

  async findAll(): Promise<Song[]> {
    return this.songModel.find().exec();
  }

  async findById(id: string): Promise<Song> {
    if (!id) {
      throw new NotFoundException('id is required');
    }
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Song with id "${id}" not found`);
    }
    const song = await this.songModel.findById(id).exec();
    console.log('song', song);

    if (!song) {
      throw new NotFoundException('Song not found');
    }
    return song;
  }
}
