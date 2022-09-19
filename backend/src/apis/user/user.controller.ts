import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserInput } from './dtos/createUser.input';
import { UserService } from './user.service';

@Controller('uesr')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post()
  async create(@Body() input: CreateUserInput) {
    return await this.userService.create(input);
  }

  @Get(':userId')
  async getUser(@Param('userId') userId: number) {
    return await this.userService.findOne(userId);
  }
}
