import {
  Body,
  Controller,
  Post,
  Inject,
  CACHE_MANAGER,
  Patch,
  Get,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BossRaidService } from './bossRaid.service';
import axios from 'axios';
import { CreateRaidInput } from './dtos/createRaid.input';
import { UpdateRaidInput } from './dtos/updateRaid.input';
import { UserID } from './dtos/userId.dto';

@Controller('bossRaid')
@ApiTags('bossRaid')
export class BossRaidContorller {
  constructor(
    private readonly bossRaidService: BossRaidService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * @POST ("/bossRaid/enter")
   * @description 보스 레이드 진입 (레이드 레코드 생성)
   */
  // @ApiBadRequestResponse({schema:})
  @Post('enter')
  @ApiOperation({ summary: '레이드 진입' })
  @ApiCreatedResponse({ description: '레이드 진입 성공여부' })
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

  /**
   *
   * @PATCH ("/bossRaid/end")
   * @description 보스 레이드 종료
   */
  @Patch('end')
  @ApiOperation({ summary: '레이드 종료' })
  @ApiOkResponse({ description: '레이드 성공' })
  @ApiResponse({ status: 422, description: '존재하지 않는 레코드입니다.' })
  @ApiResponse({ status: 401, description: '옳지 않은 유저입니다.' })
  @ApiResponse({
    status: 408,
    description: '제한시간이 만료되었습니다. (레이드 실패)',
  })
  async update(@Body() input: UpdateRaidInput) {
    return await this.bossRaidService.update(input);
  }

  /**
   * @GET ("/bossRaid")
   * @description 레이드 상태 (진입 가능 여부 등) 조회
   */
  @Get()
  @ApiOperation({ summary: '레이드 상태 조회' })
  @ApiOkResponse({ description: '조회 성공' })
  async getStatus() {
    return await this.bossRaidService.getStatus();
  }

  /**
   *
   * @POST ("/bossRaid/topRankerList")
   * @description 보스 레이드 랭킹 조회
   */
  @Post('topRankerList')
  @ApiOperation({ summary: '랭킹 조회' })
  @ApiOkResponse({ description: '조회 성공' })
  async getRanking(@Body() userId: UserID) {
    return await this.bossRaidService.getRanking(userId.userId);
  }
}
