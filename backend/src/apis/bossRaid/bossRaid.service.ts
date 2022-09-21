import {
  CACHE_MANAGER,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { CreateRaidInput } from './dtos/createRaid.input';
import { UpdateRaidInput } from './dtos/updateRaid.input';
import { BossRaid } from './entities/bossRaid.entity';
import { Cache } from 'cache-manager';
import { UserID } from './dtos/userId.dto';

export interface RankingInfo {
  ranking: number; // 랭킹 1위의 ranking 값은 0입니다.
  userId: number;
  totalScore: number;
}

@Injectable()
export class BossRaidService {
  constructor(
    @InjectRepository(BossRaid)
    private readonly bossRaidRepository: Repository<BossRaid>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    private readonly dataSource: DataSource,
  ) {}
  async create(input: CreateRaidInput, raidInfo) {
    const user = await this.userRepository.findOneBy({ id: input.userId });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');
    try {
      const currentTime = new Date();
      const recent = await queryRunner.manager.find(BossRaid, {
        order: { enterTime: 'DESC' },
        take: 1,
      });

      if (recent[0] === undefined || recent[0].endTime < currentTime) {
        // enterTime = 현재시간, default endTime = 현재시간 + 제한시간
        const enterTime = currentTime;
        const expireTime = new Date();

        expireTime.setSeconds(
          enterTime.getSeconds() + Number(raidInfo.bossRaidLimitSeconds),
        );
        const endTime = expireTime;

        const result = await queryRunner.manager.save(BossRaid, {
          user: user,
          score: raidInfo.levels[input.level].score,
          enterTime: enterTime,
          endTime: endTime, // = expireTime
        });
        await queryRunner.commitTransaction();
        return {
          isEntered: true,
          raidRecordId: result.raidRecordId,
        };
      } else {
        await queryRunner.rollbackTransaction();
        return {
          isEntered: false,
        };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(input: UpdateRaidInput) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 존재하지 않는 레이드 레코드 예외 처리
      const raid = await queryRunner.manager.findOneBy(BossRaid, {
        raidRecordId: input.raidRecordId,
      });
      if (!raid) {
        throw new HttpException('존재하지 않는 기록입니다.', 422);
      }
      // 2. 레이드 레코드의 userId와 맞지 않는 예외 처리
      if (raid.user.id !== input.userId) {
        throw new HttpException('옳지 않은 유저입니다.', 401);
      }
      // 3. 레이드 제한시간이 지났다면 예외 처리
      const endTime = new Date();
      if (raid.endTime < endTime) {
        throw new HttpException('제한시간이 만료되었습니다.', 408);
      }
      // 4. 레이드 종료시간 기입
      const result = await queryRunner.manager.save(BossRaid, {
        raidRecordId: input.raidRecordId,
        endTime: endTime,
        isCleared: true,
      });
      // 5. 유저 종합점수 갱신
      const user = await queryRunner.manager.findOneBy(User, {
        id: input.userId,
      });
      const total_score = user.total_score + raid.score;
      await queryRunner.manager.save(User, {
        id: input.userId,
        total_score: total_score,
      });
      await queryRunner.commitTransaction();
      await this.cacheManager.set(`user${input.userId}`, total_score, {
        ttl: 0,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStatus() {
    const recent = await this.bossRaidRepository.find({
      order: { enterTime: 'DESC' },
      take: 1,
    });
    const currentTime = new Date();
    if (recent[0] === undefined || recent[0].endTime < currentTime) {
      return {
        canEnter: true,
      };
    } else {
      return {
        canEnter: false,
        enterdUserId: recent[0].user.id,
      };
    }
  }

  async getRanking(userId: number) {
    let result: RankingInfo;
    let myRankingInfo: RankingInfo;
    const users = await this.cacheManager.store.keys('user*');

    const userScores = await Promise.all(
      users.map(async (ele) => {
        const userId = ele.substring(4);
        const userTotalScore = await this.cacheManager.get(ele);
        return [userId, userTotalScore];
      }),
    );

    const ranking = userScores.sort((a, b) => {
      a = a[1];
      b = b[1];
      return b - a;
    });
    const topRankerInfoList = ranking.map((ele, idx) => {
      if (ele[0] === String(userId)) {
        myRankingInfo = { ranking: idx, userId: ele[0], totalScore: ele[1] };
      }
      result = { ranking: idx, userId: ele[0], totalScore: ele[1] };
      return result;
    });
    return { topRankerInfoList, myRankingInfo };
  }
}
