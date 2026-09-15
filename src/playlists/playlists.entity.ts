import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Song } from '../songs/song.entity.js';
import { User } from '../users/user.entity.js';

@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() name: string;

  @OneToMany(() => Song, (song) => song.playlist)
  songs: Relation<Song[]>;

  @ManyToOne(() => User, (user) => user.playlists)
  user: Relation<User>;
}
