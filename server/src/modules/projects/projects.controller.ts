import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsBoolean, IsEnum, IsOptional, IsString, Length, Matches } from "class-validator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { ProjectsService } from "./projects.service";

class CreateProjectDto {
  @IsString()
  @Matches(/^[A-Z0-9-]{2,20}$/)
  key!: string;

  @IsString()
  @Length(1, 80)
  name!: string;

  @IsOptional()
  @IsEnum(["private", "public"] as const)
  visibility?: "private" | "public";
}

class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsEnum(["private", "public"] as const)
  visibility?: "private" | "public";

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

@UseGuards(AuthGuard("jwt"))
@Controller("projects")
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("q") q?: string,
    @Query("visibility") visibility?: "private" | "public",
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    return this.service.paginate({
      page: pageNum,
      pageSize: sizeNum,
      q,
      visibility,
      sortField,
      sortOrder,
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("member", "project_manager")
  create(@Body() body: CreateProjectDto) {
    return this.service.create({ ...body, createdBy: "system" });
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateProjectDto) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Get(":id/members")
  @UseGuards(RolesGuard)
  @Roles("admin", "project_manager", "member")
  getMembers(
    @Param("id") id: string,
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 50,
    @Query("q") q?: string,
  ) {
    return this.service.getProjectMembers(id, { page, pageSize, q });
  }
}
