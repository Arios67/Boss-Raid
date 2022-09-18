import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateRaidInput {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: Number,
  })
  readonly userId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: Number,
  })
  readonly raidRecordId: number;
}
