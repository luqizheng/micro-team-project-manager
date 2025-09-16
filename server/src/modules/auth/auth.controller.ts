import { Body, Controller, Post, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtUser } from './interfaces/jwt-user.interface';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: JwtUser) {
    // 使用装饰器直接获取JWT用户信息
     console.log('JWT用户ID:', user.userId);
    // console.log('JWT用户邮箱:', user.email);
    
    return this.auth.getProfile(user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: JwtUser, @Body() body: any) {
    // 使用装饰器直接获取JWT用户信息
    return this.auth.updateProfile(user.userId, {
      name: body.name,
      displayName: body.displayName,
      email: body.email,
      avatar: body.avatar
    });
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  updatePassword(@CurrentUser() user: JwtUser, @Body() body: any) {
    // 使用装饰器直接获取JWT用户信息
    return this.auth.updatePassword(user.userId, body.currentPassword, body.newPassword);
  }
}


