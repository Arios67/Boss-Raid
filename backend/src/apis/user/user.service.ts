import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput } from './dtos/createUser.input';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  // async findOne(id: number) {
  //   const user = await this.userRepository.findOneBy({ id });
  // }
}
