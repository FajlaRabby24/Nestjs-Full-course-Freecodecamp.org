import { Body, Controller, Get, Post } from '@nestjs/common';
import { AlbumsService } from './albums.service.js';
import { CreateAlbumDTO } from './dto/create-album-dto.js';
import { Album } from './schemas/album.schema.js';

@Controller('albums')
export class AlbumsController {
  constructor(private albumService: AlbumsService) {}

  @Post()
  create(
    @Body()
    createAlbumDTO: CreateAlbumDTO,
  ): Promise<Album> {
    return this.albumService.createAlbum(createAlbumDTO);
  }

  @Get()
  find(): Promise<Album[]> {
    return this.albumService.findAlbums();
  }
}
