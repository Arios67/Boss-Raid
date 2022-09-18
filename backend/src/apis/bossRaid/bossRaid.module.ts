import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { BossRaidContorller } from './bossRaid.controller';
import { BossRaidService } from './bossRaid.service';
import { BossRaid } from './entities/bossRaid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BossRaid, User])],
  controllers: [BossRaidContorller],
  providers: [BossRaidService],
})
export class BossRaidModule {}
