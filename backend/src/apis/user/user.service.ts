import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BossRaidDto } from '../bossRaid/dtos/bossRaid.dto';
import { BossRaid } from '../bossRaid/entities/bossRaid.entity';
import { CreateUserInput } from './dtos/createUser.input';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(BossRaid)
    private readonly bossRaidRepository: Repository<BossRaid>,
  ) {}

  async create(input: CreateUserInput) {
    // username 중복 체크
    const prev = await this.userRepository.findOneBy({
      username: input.username,
    });
    if (prev) {
      throw new HttpException('이미 존재하는 유저명입니다.', 409);
    }

    const result = await this.userRepository.save({ ...input });
    return result.id;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new HttpException('', 204);
    }
    const raidHistory = await this.bossRaidRepository.find({
      where: { user: user },
    });
    const result = raidHistory.map((e) => new BossRaidDto(e));
    return {
      totalScore: user.total_score,
      bossRaidHistory: result,
    };
  }
}
