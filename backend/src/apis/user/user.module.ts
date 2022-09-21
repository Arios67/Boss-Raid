import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BossRaid } from '../bossRaid/entities/bossRaid.entity';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, BossRaid])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
