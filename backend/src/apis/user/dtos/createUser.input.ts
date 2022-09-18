import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserInput extends OmitType(User, ['id', 'total_score']) {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
  })
  readonly username: string;
}
