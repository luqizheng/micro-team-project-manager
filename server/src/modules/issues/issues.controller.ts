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
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { IssuesService } from "./issues.service";
import { IssueType, IssueEntity } from "./issue.entity";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsArray,
  IsDateString,
} from "class-validator";

class CreateIssueDto {
  @IsUUID()
  projectId!: string;

  @IsEnum(IssueType)
  type!: IssueType;

  @IsString()
  @Length(1, 140)
  title!: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number | null;

  @IsOptional()
  @IsNumber()
  actualHours?: number | null;

  @IsOptional()
  @IsString()
  state?: string;
}

class UpdateIssueDto {
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsString()
  @Length(1, 140)
  title?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number | null;

  @IsOptional()
  @IsNumber()
  actualHours?: number | null;

  @IsOptional()
  @IsString()
  state?: string;
}

class PutIssueDto {
  @IsOptional()
  @IsEnum(IssueType)
  type!: IssueType;

  @IsOptional()
  @IsString()
  @Length(1, 140)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsNumber()
  storyPoints?: number;

  @IsOptional()
  @IsNumber()
  estimateMinutes?: number;

  @IsOptional()
  @IsNumber()
  remainingMinutes?: number;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number | null;

  @IsOptional()
  @IsNumber()
  actualHours?: number | null;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

class TransitionDto {
  @IsString()
  to!: string;
}

@UseGuards(AuthGuard("jwt"))
@Controller("projects/:projectId/issues")
export class IssuesController {
  constructor(private readonly service: IssuesService) {}

  @Get()
  list(
    @Param("projectId") projectId: string,
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("q") q?: string,
    @Query("type") type?: IssueType,
    @Query("state") state?: string,
    @Query("assigneeId") assigneeId?: string,
    @Query("sprintId") sprintId?: string,
    @Query("sortField") sortField?: string,
    @Query("sortOrder") sortOrder?: "ASC" | "DESC",
    @Query("treeView") treeView?: string,
    @Query("parentId") parentId?: string
  ) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const isTreeView = treeView === "true";
    console.log('projectid',projectId)
    return this.service.paginate({
      projectId,
      page: p,
      pageSize: s,
      q,
      type,
      state,
      assigneeId,
      sprintId,
      sortField,
      sortOrder,
      treeView: isTreeView,
      parentId,
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get("states/:type")
  getStates(
    @Param("projectId") projectId: string,
    @Param("type") type: IssueType
  ) {
    return this.service.getStatesByProjectAndType(projectId, type);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("member", "project_manager")
  create(@Body() body: CreateIssueDto) {
    if (body.type === "task") {
      if (
        body.estimatedHours != null &&
        !/^\d{1,3}(\.\d)?$/.test(String(body.estimatedHours))
      ) {
        throw new Error(
          "estimatedHours must be a number with 1 decimal at most"
        );
      }
      if (
        body.actualHours != null &&
        !/^\d{1,3}(\.\d)?$/.test(String(body.actualHours))
      ) {
        throw new Error("actualHours must be a number with 1 decimal at most");
      }
    } else {
      body.estimatedHours = null;
      body.actualHours = null;
    }
    body.state = "todo";
    return this.service.create(body);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("member", "project_manager")
  update(@Param("id") id: string, @Body() body: UpdateIssueDto) {
    if (
      body.type === "task" ||
      body.estimatedHours != null ||
      body.actualHours != null
    ) {
      if (
        body.estimatedHours != null &&
        !/^\d{1,3}(\.\d)?$/.test(String(body.estimatedHours))
      ) {
        throw new Error(
          "estimatedHours must be a number with 1 decimal at most"
        );
      }
      if (
        body.actualHours != null &&
        !/^\d{1,3}(\.\d)?$/.test(String(body.actualHours))
      ) {
        throw new Error("actualHours must be a number with 1 decimal at most");
      }
    }
    return this.service.update(id, body);
  }

  @Put(":id")
  @UseGuards(RolesGuard)
  @Roles("member", "project_manager")
  async put(@Param("id") id: string, @Body() body: PutIssueDto) {
    if (body.type === "task") {
      if (
        body.estimatedHours &&
        !/^\d{1,3}(\.\d)?$/.test(String(body.estimatedHours))
      ) {
        throw new Error(
          "estimatedHours must be a number with 1 decimal at most"
        );
      }
      if (
        body.actualHours &&
        !/^\d{1,3}(\.\d)?$/.test(String(body.actualHours))
      ) {
        throw new Error("actualHours must be a number with 1 decimal at most");
      }
    } else {
      body.estimatedHours = null;
      body.actualHours = null;
    }
    // 从数据库获取现有issue
    const existingIssue = await this.service.findOne(id);
    if (!existingIssue) {
      throw new Error("Issue not found");
    }

    // 构建更新数据
    const updateData = {
      ...existingIssue,
      ...body,
    } as Partial<IssueEntity>;

    // 处理日期转换
    if (body.dueAt) {
      updateData.dueAt = new Date(body.dueAt);
    }

    return this.service.update(id, updateData);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("member", "project_manager")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/transition")
  @UseGuards(RolesGuard)
  @Roles("member", "project_manager")
  transition(@Param("id") id: string, @Body() body: TransitionDto) {
    return this.service.update(id, { state: body.to });
  }

  @Post(":id/sync-to-gitlab")
  @UseGuards(RolesGuard)
  @Roles("member", "project_manager")
  async syncToGitLab(@Param("id") id: string, @Param("projectId") projectId: string) {
    return this.service.syncToGitLab(id, projectId);
  }
}

@UseGuards(AuthGuard("jwt"))
@Controller("my-tasks")
export class MyTasksController {
  constructor(private readonly service: IssuesService) {}

  @Get()
  getMyTasks(
    @Request() req: any,
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("q") q?: string,
    @Query("type") type?: IssueType,
    @Query("state") state?: string,
    @Query("priority") priority?: string,
    @Query("sortBy") sortBy?: string
  ) {
    console.log("getMyTasks", req.user);
    const userId = req.user.id;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    
    return this.service.getMyTasks({
      userId,
      page: p,
      pageSize: s,
      q,
      type,
      state,
      priority,
      sortBy: sortBy || 'priority'
    });
  }
}
