import {
  Body,
  Controller,
  Post,
  Inject,
  CACHE_MANAGER,
  Patch,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ApiTags } from '@nestjs/swagger';
import { BossRaidService } from './bossRaid.service';
import axios from 'axios';
import { CreateRaidInput } from './dtos/createRaid.input';
import { UpdateRaidInput } from './dtos/updateRaid.input';

@Controller('bossRaid')
@ApiTags('bossRaid')
export class BossRaidContorller {
  constructor(
    private readonly bossRaidService: BossRaidService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  @Post('enter')
  async create(@Body() input: CreateRaidInput) {
    let raidInfo = {
      bossRaidLimitSeconds: await this.cacheManager.get('bossRaidLimitSeconds'),
      levels: JSON.parse(await this.cacheManager.get('levels')),
    };

    if (!raidInfo.levels) {
      const staticData = await axios.get(
        'https://dmpilf5svl7rv.cloudfront.net/assignment/backend/bossRaidData.json',
      );
      raidInfo = staticData.data.bossRaids[0];
      await this.cacheManager.set(
        'bossRaidLimitSeconds',
        String(raidInfo.bossRaidLimitSeconds),
        { ttl: 0 },
      );
      await this.cacheManager.set('levels', JSON.stringify(raidInfo.levels), {
        ttl: 0,
      });
    }
    return await this.bossRaidService.create(input, raidInfo);
  }

  @Patch('end')
  async update(@Body() input: UpdateRaidInput) {
    return await this.bossRaidService.update(input);
  }
}
