import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { CreateRaidInput } from './dtos/createRaid.input';
import { UpdateRaidInput } from './dtos/updateRaid.input';
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
      const currentTime = new Date();
      const recent = await queryRunner.manager.find(BossRaid, {
        order: { enterTime: 'DESC' },
        take: 1,
      });

      if (recent[0] === undefined || recent[0].endTime < currentTime) {
        // enterTime = 현재 시간, default endTime = enterTime + 제한시간
        const enterTime = currentTime;
        currentTime.setSeconds(
          currentTime.getSeconds() + Number(raidInfo.bossRaidLimitSeconds),
        );
        const endTime = currentTime;

        const result = await queryRunner.manager.save(BossRaid, {
          user: user,
          score: raidInfo.levels[input.level].score,
          enterTime: enterTime,
          endTime: endTime,
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
      const target = await queryRunner.manager.findOneBy(BossRaid, {
        raidRecordId: input.raidRecordId,
      });
      if (!target) {
        throw new HttpException('존재하지 않는 기록입니다.', 422);
      }
      // 2. 레이드 레코드의 userId와 맞지 않는 예외 처리
      if (target.user.id !== input.userId) {
        throw new HttpException('옳지 않은 유저입니다.', 401);
      }
      // 3. 레이드 제한시간이 지났다면 예외 처리
      const endTime = new Date();
      if (target.endTime < endTime) {
        throw new HttpException('제한시간이 만료되었습니다.', 408);
      }
      const result = await queryRunner.manager.save(BossRaid, {
        raidRecordId: input.raidRecordId,
        endTime: endTime,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
