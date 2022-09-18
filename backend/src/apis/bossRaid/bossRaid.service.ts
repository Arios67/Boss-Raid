import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { CreateRaidInput } from './dtos/createRaid.input';
import { BossRaid } from './entities/bossRaid.entity';

@Injectable()
export class BossRaidService {
  constructor(
    @InjectRepository(BossRaid)
    private readonly bossRaidRepository: Repository<BossRaid>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}
  async create(input: CreateRaidInput, raidInfo) {
    const user = await this.userRepository.findOneBy({ id: input.userId });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('REPEATABLE READ');
    try {
      const entertime = new Date();
      const recent = await queryRunner.manager.find(BossRaid, {
        order: { entertime: 'DESC' },
        take: 1,
      });

      if (recent[0] === undefined || recent[0].endTime < entertime) {
        const result = await queryRunner.manager.save(BossRaid, {
          user: user,
          score: raidInfo.levels[input.level].score,
          entertime: entertime,
          endtime: entertime.setSeconds(
            entertime.getSeconds() + raidInfo.bossRaidLimitSeconds,
          ), // 입장시간 + 레이드 제한시간
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
      throw error + ' at BossRaid Create !!!';
    } finally {
      await queryRunner.release();
    }
  }

  async update(input: { userId: number; raidRecordId: number }) {
    // 1. 존재하지 않는 레이드 레코드 예외 처리
    // 2. 레이드 레코드의 userId와 맞지 않는 예외 처리
    // 3. 레이드 제한시간이 지났다면 예외 처리
  }
}
