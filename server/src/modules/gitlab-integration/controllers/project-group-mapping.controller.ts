import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { GitLabGroupMappingService } from "../services/gitlab-group-mapping.service";
import { CreateGroupMappingDto } from "../dto/create-group-mapping.dto";
import { UpdateGroupMappingDto } from "../dto/update-group-mapping.dto";
import { GroupMappingResponseDto } from "../dto/group-mapping-response.dto";

/**
 * 项目分组映射控制器
 * 负责管理PM项目与GitLab分组的映射关系
 */
@ApiTags("项目分组映射管理")
@Controller("gitlab/gitlab-groups")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectGroupMappingController {
  private readonly logger = new Logger(ProjectGroupMappingController.name);

  constructor(
    private readonly groupMappingService: GitLabGroupMappingService
  ) {}

  /**
   * 获取项目的分组映射列表
   */
  @Get()
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "获取项目的分组映射列表" })
  @ApiParam({ name: "projectId", description: "项目ID" })
  @ApiResponse({
    status: 200,
    description: "成功获取分组映射列表",
    type: [GroupMappingResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "未授权",
  })
  @ApiResponse({
    status: 403,
    description: "权限不足",
  })
  @ApiResponse({
    status: 404,
    description: "项目不存在",
  })
  async getProjectGroupMappings(
    @Param("projectId") projectId: string
  ): Promise<GroupMappingResponseDto[]> {
    this.logger.debug(`获取项目分组映射列表: ${projectId}`);

    return await this.groupMappingService.getProjectGroupMappings(projectId);
  }

  /**
   * 创建分组映射
   */
  @Post()
  @Roles("admin", "project_manager")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "创建分组映射" })
  @ApiParam({ name: "projectId", description: "项目ID" })
  @ApiResponse({
    status: 201,
    description: "成功创建分组映射",
    type: GroupMappingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "请求参数错误",
  })
  @ApiResponse({
    status: 401,
    description: "未授权",
  })
  @ApiResponse({
    status: 403,
    description: "权限不足",
  })
  @ApiResponse({
    status: 404,
    description: "项目或GitLab实例不存在",
  })
  @ApiResponse({
    status: 409,
    description: "分组映射已存在",
  })
  async createGroupMapping(
    @Param("projectId") projectId: string,
    @Body() dto: CreateGroupMappingDto
  ): Promise<GroupMappingResponseDto> {
    this.logger.log(`创建分组映射: ${projectId} -> ${dto.gitlabGroupPath}`, {
      projectId,
      gitlabInstanceId: dto.gitlabInstanceId,
      gitlabGroupId: dto.gitlabGroupId,
    });

    return await this.groupMappingService.createGroupMapping(projectId, dto);
  }

  /**
   * 更新分组映射
   */
  @Put(":mappingId")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "更新分组映射" })
  @ApiParam({ name: "mappingId", description: "映射ID" })
  @ApiResponse({
    status: 200,
    description: "成功更新分组映射",
    type: GroupMappingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "请求参数错误",
  })
  @ApiResponse({
    status: 401,
    description: "未授权",
  })
  @ApiResponse({
    status: 403,
    description: "权限不足",
  })
  @ApiResponse({
    status: 404,
    description: "映射不存在",
  })
  async updateGroupMapping(
    @Param("mappingId") mappingId: string,
    @Body() dto: UpdateGroupMappingDto
  ): Promise<GroupMappingResponseDto> {
    this.logger.log(`更新分组映射: ${mappingId}`, {
      mappingId,
      updates: dto,
    });

    return await this.groupMappingService.updateGroupMapping(mappingId, dto);
  }

  /**
   * 删除分组映射
   */
  @Delete(":mappingId")
  @Roles("admin", "project_manager")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "删除分组映射" })
  @ApiParam({ name: "mappingId", description: "映射ID" })
  @ApiResponse({
    status: 204,
    description: "成功删除分组映射",
  })
  @ApiResponse({
    status: 401,
    description: "未授权",
  })
  @ApiResponse({
    status: 403,
    description: "权限不足",
  })
  @ApiResponse({
    status: 404,
    description: "映射不存在",
  })
  async deleteGroupMapping(
    @Param("mappingId") mappingId: string
  ): Promise<void> {
    this.logger.log(`删除分组映射: ${mappingId}`, {
      mappingId,
    });

    await this.groupMappingService.deleteGroupMapping(mappingId);
  }
}
