import { User } from 'src/apis/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BossRaid {
  @PrimaryGeneratedColumn()
  raidRecordId: string;

  @Column()
  score: number;

  @Column()
  entertime: Date;

  @Column()
  endTime: Date;

  @Column({ default: false })
  canEnter: Boolean;

  @ManyToOne(() => User, { eager: true })
  user: User;
}
