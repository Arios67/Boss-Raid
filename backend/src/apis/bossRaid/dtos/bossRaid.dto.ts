import { OmitType } from '@nestjs/swagger';
import { BossRaid } from '../entities/bossRaid.entity';

export class BossRaidDto extends OmitType(BossRaid, ['user']) {
  constructor(bossRaid: BossRaid) {
    super();
    (this.raidRecordId = bossRaid.raidRecordId),
      (this.score = bossRaid.score),
      (this.enterTime = bossRaid.enterTime),
      (this.endTime = bossRaid.endTime);
  }
}
