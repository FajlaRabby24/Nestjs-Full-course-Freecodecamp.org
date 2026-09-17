import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAlbumDTO } from './dto/create-album-dto.js';
import { Album } from './schemas/album.schema.js';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectModel(Album.name)
    private readonly albumModel: Model<Album>,
  ) {}

  async createAlbum(createAlbumDto: CreateAlbumDTO): Promise<Album> {
    return await this.albumModel.create(createAlbumDto);
  }

  async findAlbums() {
    return this.albumModel.find().populate('songs');
  }
}
