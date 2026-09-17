import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { Song } from '../../songs/schemas/song.js';

export type AlbumDocument = HydratedDocument<Album>;

@Schema()
export class Album {
  @Prop({
    required: true,
  })
  title: string;

  @Prop({ type: [Types.ObjectId], ref: 'Song' })
  songs: Song[] | Types.ObjectId[] | string[];
}

export const AlbumSchema = SchemaFactory.createForClass(Album);
