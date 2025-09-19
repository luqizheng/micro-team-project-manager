import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequirementEntity } from "./requirement.entity";
import { ProjectEntity } from "../projects/project.entity";

export interface CreateRequirementDto {
  title: string;
  description?: string;
  state?: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  labels?: string[];
  dueAt?: string;
}

export interface UpdateRequirementDto {
  title?: string;
  description?: string;
  state?: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  labels?: string[];
  dueAt?: string;
}

export interface RequirementQueryParams {
  projectId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  state?: string;
  assigneeId?: string;
  priority?: string;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
}

@Injectable()
export class RequirementsService {
  private readonly logger = new Logger(RequirementsService.name);

  constructor(
    @InjectRepository(RequirementEntity)
    private readonly requirementRepo: Repository<RequirementEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>
  ) {}

  /**
   * 创建需�?
   */
  async create(
    projectId: string,
    dto: CreateRequirementDto
  ): Promise<RequirementEntity> {
    // 验证项目存在
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("项目不存在");
    }

    const requirement = this.requirementRepo.create({
      projectId,
      title: dto.title,
      description: dto.description,
      state: dto.state || "open",
      priority: dto.priority,
      assigneeId: dto.assigneeId,
      reporterId: dto.reporterId,
      storyPoints: dto.storyPoints,
      labels: dto.labels,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });

    const saved = await this.requirementRepo.save(requirement);
    this.logger.log(`创建需求成功: ${saved.id}`);
    return saved;
  }

  /**
   * 更新需求
   */
  async update(
    id: string,
    dto: UpdateRequirementDto
  ): Promise<RequirementEntity> {
    const requirement = await this.requirementRepo.findOne({
      where: { id, deleted: false },
    });
    if (!requirement) {
      throw new NotFoundException("需求不存在");
    }

    Object.assign(requirement, {
      ...dto,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : dto.dueAt,
    });

    const saved = await this.requirementRepo.save(requirement);
    this.logger.log(`更新需求成功: ${saved.id}`);
    return saved;
  }

  /**
   * 删除需求
   */
  async delete(id: string): Promise<void> {
    const requirement = await this.requirementRepo.findOne({
      where: { id, deleted: false },
    });
    if (!requirement) {
      throw new NotFoundException("需求不存在");
    }

      // 软删
    await this.requirementRepo.update(id, { deleted: true });
    this.logger.log(`删除需求成功: ${id}`); 
  }

  /**
   * 根据ID获取需求
   */
  async findById(id: string): Promise<RequirementEntity> {
    const requirement = await this.requirementRepo.findOne({
      where: { id, deleted: false },
      relations: ["subsystems", "featureModules", "tasks"],
    });

    if (!requirement) {
      throw new NotFoundException("需求不存在");
    }

    return requirement;
  }

  /**
   * 分页查询需求
   */
  async paginate(params: RequirementQueryParams) {
    const {
      projectId,
      page = 1,
      pageSize = 20,
      q,
      state,
      assigneeId,
      priority,
      sortField = "updatedAt",
      sortOrder = "DESC",
    } = params;

    const qb = this.requirementRepo
      .createQueryBuilder("r")
      .leftJoin("users", "assignee", "assignee.id = r.assigneeId")
      .leftJoin("users", "reporter", "reporter.id = r.reporterId")
      .addSelect("assignee.name", "assigneeName")
      .addSelect("assignee.email", "assigneeEmail")
      .addSelect("reporter.name", "reporterName")
      .addSelect("reporter.email", "reporterEmail")
      .where("r.projectId = :projectId", { projectId })
      .andWhere("r.deleted = false");

    if (q) {
      qb.andWhere("r.title LIKE :q", { q: `%${q}%` });
    }
    if (state) {
      qb.andWhere("r.state = :state", { state });
    }
    if (assigneeId) {
      qb.andWhere("r.assigneeId = :assigneeId", { assigneeId });
    }
    if (priority) {
      qb.andWhere("r.priority = :priority", { priority });
    }

    // 排序
    const safeFields = new Set([
      "title",
      "state",
      "priority",
      "storyPoints",
      "createdAt",
      "updatedAt",
    ]);
    const field = safeFields.has(sortField) ? `r.${sortField}` : "r.updatedAt";
    qb.orderBy(field, sortOrder);

    // 分页
    const offset = (page - 1) * pageSize;
    qb.skip(offset).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
    * 获取项目的所有需求（用于层级结构）  
   */
  async getByProject(projectId: string): Promise<RequirementEntity[]> {
    return this.requirementRepo.find({
      where: { projectId, deleted: false },
      relations: ["subsystems", "featureModules", "tasks"],
      order: { createdAt: "ASC" },
    });
  }

  /**
   * 获取需求的层级结构
   */
  async getHierarchy(projectId: string) {
    const requirements = await this.getByProject(projectId);

    return {
      requirements: requirements.map((req) => ({
        id: req.id,
        title: req.title,
        state: req.state,
        priority: req.priority,
        assigneeId: req.assigneeId,
        storyPoints: req.storyPoints,
        children: {
          featureModules: req.featureModules || [],
          tasks: req.tasks || [],
        },
      })),
    };
  }
}
