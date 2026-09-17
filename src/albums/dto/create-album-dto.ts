import { Types } from 'mongoose';
import type { Song } from '../../songs/schemas/song.js';

export class CreateAlbumDTO {
  title: string;
  songs?: Song[] | Types.ObjectId[] | string[];
}
