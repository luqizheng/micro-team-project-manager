import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新分组映射DTO
 */
export class UpdateGroupMappingDto {
  @ApiProperty({
    description: '是否激活',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
