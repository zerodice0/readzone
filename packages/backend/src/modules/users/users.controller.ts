import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUserProfileDto } from './dto/get-user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userid')
  async getUserProfile(@Param() getUserProfileDto: GetUserProfileDto) {
    return this.usersService.getUserProfile(getUserProfileDto);
  }
}
