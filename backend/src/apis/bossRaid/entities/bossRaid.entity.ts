import { User } from 'src/apis/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BossRaid {
  @PrimaryGeneratedColumn()
  raidRecordId: number;

  @Column()
  score: number;

  @Column()
  enterTime: Date;

  @Column()
  endTime: Date;

  @Column({ default: false })
  isCleared: Boolean;

  @ManyToOne(() => User, { eager: true })
  user: User;
}
