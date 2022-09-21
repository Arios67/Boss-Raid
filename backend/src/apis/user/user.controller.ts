import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserInput } from './dtos/createUser.input';
import { UserService } from './user.service';

@Controller('uesr')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @POST ("/user")
   * @description 유저 생성
   */
  @Post()
  @ApiOperation({ summary: '유저 생성' })
  @ApiCreatedResponse({ description: '유저 생성 성공' })
  @ApiResponse({ status: 409, description: '이미 존재하는 유저명입니다.' })
  async create(@Body() input: CreateUserInput) {
    return await this.userService.create(input);
  }

  /**
   * @GET ("/user/:userId")
   * @description 유저 조회
   */
  @Get(':userId')
  @ApiOperation({ summary: '유저 조회' })
  @ApiOkResponse({ description: '조회 성공' })
  @ApiNoContentResponse({ description: 'No Content' })
  async getUser(@Param('userId') userId: number) {
    return await this.userService.findOne(userId);
  }
}
