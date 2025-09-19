// JWT信息获取使用示例

import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtUser } from '../interfaces/jwt-user.interface';

@Controller('example')
export class ExampleController {
  
  // 方法1: 使用装饰器（推荐�?
  @Get('user-info')
  @UseGuards(JwtAuthGuard)
  getUserInfo(@CurrentUser() user: JwtUser) {
    // 直接获取JWT中的用户信息
    const userId = user.userId;
    const userEmail = user.email;
    
    return {
      message: '用户信息获取成功',
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    };
  }
  
  // 方法2: 使用Request对象
  @Get('user-info-alt')
  @UseGuards(JwtAuthGuard)
  getUserInfoAlternative(@Request() req: { user: JwtUser }) {
    // 通过Request对象获取JWT用户信息
    const userId = req.user.userId;
    const userEmail = req.user.email;
    
    return {
      message: '用户信息获取成功（替代方法）',
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    };
  }
  
  // 方法3: 在业务逻辑中使用JWT信息
  @Post('create-something')
  @UseGuards(JwtAuthGuard)
  createSomething(@CurrentUser() user: JwtUser, @Body() data: any) {
    // 使用JWT中的用户ID创建资源
    const resource = {
      id: generateId(),
      name: data.name,
      createdBy: user.userId,  // 使用JWT中的用户ID
      createdAt: new Date(),
      creatorEmail: user.email  // 使用JWT中的用户邮箱
    };
    
    return {
      message: '资源创建成功',
      resource,
      creator: {
        id: user.userId,
        email: user.email
      }
    };
  }
}

// 辅助函数
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
