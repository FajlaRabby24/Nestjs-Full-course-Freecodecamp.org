import {
  Entity,
  JoinColumn,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Song } from '../songs/song.entity.js';
import { User } from '../users/user.entity.js';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: Relation<User>;

  @ManyToMany(() => Song, (song) => song.artists)
  songs: Relation<Song[]>;
}
