import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  FeatureModulesService,
  CreateFeatureModuleDto,
  UpdateFeatureModuleDto,
  FeatureModuleQueryParams,
} from "./feature-modules.service";
import { IsString, IsOptional, IsUUID, Length, IsArray } from "class-validator";

class CreateFeatureModuleRequestDto {
  @IsString()
  @Length(1, 140)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsUUID()
  requirementId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

class UpdateFeatureModuleRequestDto {
  @IsOptional()
  @IsString()
  @Length(1, 140)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsUUID()
  requirementId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

@Controller("projects/:projectId/feature-modules")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class FeatureModulesController {
  constructor(private readonly featureModulesService: FeatureModulesService) {}

  @Post()
  @Roles("admin", "project_manager")
  async create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateFeatureModuleRequestDto
  ) {
    return this.featureModulesService.create(projectId, dto);
  }

  @Get()
  @Roles("admin", "project_manager", "member")
  async findAll(
    @Param("projectId") projectId: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
    @Query("q") q?: string,
    @Query("state") state?: string,
    @Query("assigneeId") assigneeId?: string,
    @Query("requirementId") requirementId?: string,
    @Query("sortField") sortField?: string,
    @Query("sortOrder") sortOrder?: "ASC" | "DESC"
  ) {
    const params: FeatureModuleQueryParams = {
      projectId,
      page,
      pageSize,
      q,
      state,
      assigneeId,
      requirementId,
      sortField,
      sortOrder,
    };
    return this.featureModulesService.paginate(params);
  }

  @Get("by-requirement/:requirementId")
  @Roles("admin", "project_manager", "member")
  async getByRequirement(
    @Param("projectId") projectId: string,
    @Param("requirementId") requirementId: string
  ) {
    return this.featureModulesService.getByRequirement(requirementId);
  }

  @Get(":id")
  @Roles("admin", "project_manager", "member")
  async findOne(
    @Param("projectId") projectId: string,
    @Param("id") id: string
  ) {
    return this.featureModulesService.findById(id);
  }

  @Patch(":id")
  @Roles("admin", "project_manager")
  async update(
    @Param("projectId") projectId: string,
    @Param("id") id: string,
    @Body() dto: UpdateFeatureModuleRequestDto
  ) {
    return this.featureModulesService.update(id, dto);
  }

  @Delete(":id")
  @Roles("admin", "project_manager")
  async remove(@Param("projectId") projectId: string, @Param("id") id: string) {
    await this.featureModulesService.delete(id);
    return { message: "功能模块删除成功" };
  }

  @Put(":id")
  @Roles("admin", "project_manager", "member")
  async updateState(
    @Param("id") id: string,
    @Body() dto: UpdateFeatureModuleDto
  ) {
    return this.featureModulesService.update(id, dto);
  }
}
