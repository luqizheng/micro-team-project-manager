import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { ProjectEntity } from '../projects/project.entity';
import { IssueEntity, IssueType } from '../issues/issue.entity';
import { MembershipEntity } from '../memberships/membership.entity';
import { IssueStateEntity } from '../issue-states/issue-state.entity';
import { createHash } from 'crypto';

@Injectable()
export class DemoDataService {
  private readonly logger = new Logger(DemoDataService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepo: Repository<MembershipEntity>,
    @InjectRepository(IssueStateEntity)
    private readonly issueStateRepo: Repository<IssueStateEntity>,
  ) {}

  private hash(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  async initializeDemoData(): Promise<void> {
    this.logger.log('开始初始化Demo数据...');

    try {
      // 1. 创建demo用户
      const demoUser = await this.createDemoUser();
      const demoManager = await this.createDemoManager();

      // 2. 创建demo项目
      const demoProject = await this.createDemoProject(demoManager.id);

      // 3. 添加项目成员
      await this.addProjectMembers(demoProject.id, demoUser.id, demoManager.id);

      // 4. 创建issue状态
      await this.createIssueStates(demoProject.id);

      // 5. 创建demo issues
      await this.createDemoIssues(demoProject.id, demoUser.id, demoManager.id);

      this.logger.log('Demo数据初始化完成');
    } catch (error) {
      this.logger.error('Demo数据初始化失败:', error);
      throw error;
    }
  }

  private async createDemoUser(): Promise<UserEntity> {
    const existingUser = await this.userRepo.findOne({ where: { email: 'demo_user@example.com' } });
    if (existingUser) {
      this.logger.log('Demo用户已存在，跳过创建');
      return existingUser;
    }

    const user = this.userRepo.create({
      email: 'demo_user@example.com',
      name: 'demo_user',
      displayName: 'Demo用户',
      passwordHash: this.hash('demo123456'),
      status: 'active',
      systemRoles: ['user'],
    });

    const savedUser = await this.userRepo.save(user);
    this.logger.log('Demo用户创建成功');
    return savedUser;
  }

  private async createDemoManager(): Promise<UserEntity> {
    const existingManager = await this.userRepo.findOne({ where: { email: 'demo_manager@example.com' } });
    if (existingManager) {
      this.logger.log('Demo管理员已存在，跳过创建');
      return existingManager;
    }

    const manager = this.userRepo.create({
      email: 'demo_manager@example.com',
      name: 'demo_manager',
      displayName: 'Demo管理员',
      passwordHash: this.hash('demo123456'),
      status: 'active',
      systemRoles: ['user'],
    });

    const savedManager = await this.userRepo.save(manager);
    this.logger.log('Demo管理员创建成功');
    return savedManager;
  }

  private async createDemoProject(createdBy: string): Promise<ProjectEntity> {
    const existingProject = await this.projectRepo.findOne({ where: { key: 'DEMO' } });
    if (existingProject) {
      this.logger.log('Demo项目已存在，跳过创建');
      return existingProject;
    }

    const project = this.projectRepo.create({
      key: 'DEMO',
      name: 'Demo项目管理示例',
      visibility: 'public',
      createdBy,
    });

    const savedProject = await this.projectRepo.save(project);
    this.logger.log('Demo项目创建成功');
    return savedProject;
  }

  private async addProjectMembers(projectId: string, userId: string, managerId: string): Promise<void> {
    // 添加普通成员
    const existingUserMembership = await this.membershipRepo.findOne({
      where: { projectId, userId }
    });
    if (!existingUserMembership) {
      await this.membershipRepo.save({
        projectId,
        userId,
        role: 'member',
      });
    }

    // 添加项目经理
    const existingManagerMembership = await this.membershipRepo.findOne({
      where: { projectId, userId: managerId }
    });
    if (!existingManagerMembership) {
      await this.membershipRepo.save({
        projectId,
        userId: managerId,
        role: 'project_manager',
      });
    }

    this.logger.log('项目成员添加成功');
  }

  private async createIssueStates(projectId: string): Promise<void> {
    const states = [
      // 需求状态
      { issueType: IssueType.requirement, stateKey: 'open', stateName: '待分析', color: '#1890ff', isInitial: true, isFinal: false, sortOrder: 1 },
      { issueType: IssueType.requirement, stateKey: 'analyzing', stateName: '分析中', color: '#52c41a', isInitial: false, isFinal: false, sortOrder: 2 },
      { issueType: IssueType.requirement, stateKey: 'approved', stateName: '已确认', color: '#722ed1', isInitial: false, isFinal: false, sortOrder: 3 },
      { issueType: IssueType.requirement, stateKey: 'rejected', stateName: '已拒绝', color: '#f5222d', isInitial: false, isFinal: true, sortOrder: 4 },

      // 任务状态
      { issueType: IssueType.task, stateKey: 'todo', stateName: '待办', color: '#1890ff', isInitial: true, isFinal: false, sortOrder: 1 },
      { issueType: IssueType.task, stateKey: 'in_progress', stateName: '进行中', color: '#fa8c16', isInitial: false, isFinal: false, sortOrder: 2 },
      { issueType: IssueType.task, stateKey: 'testing', stateName: '测试中', color: '#13c2c2', isInitial: false, isFinal: false, sortOrder: 3 },
      { issueType: IssueType.task, stateKey: 'done', stateName: '已完成', color: '#52c41a', isInitial: false, isFinal: true, sortOrder: 4 },

      // Bug状态
      { issueType: IssueType.bug, stateKey: 'open', stateName: '待修复', color: '#f5222d', isInitial: true, isFinal: false, sortOrder: 1 },
      { issueType: IssueType.bug, stateKey: 'fixing', stateName: '修复中', color: '#fa8c16', isInitial: false, isFinal: false, sortOrder: 2 },
      { issueType: IssueType.bug, stateKey: 'testing', stateName: '测试中', color: '#13c2c2', isInitial: false, isFinal: false, sortOrder: 3 },
      { issueType: IssueType.bug, stateKey: 'resolved', stateName: '已修复', color: '#52c41a', isInitial: false, isFinal: true, sortOrder: 4 },
    ];

    for (const state of states) {
      const existingState = await this.issueStateRepo.findOne({
        where: { projectId, issueType: state.issueType, stateKey: state.stateKey }
      });
      
      if (!existingState) {
        await this.issueStateRepo.save({
          projectId,
          ...state,
        });
      }
    }

    this.logger.log('Issue状态创建成功');
  }

  private async createDemoIssues(projectId: string, userId: string, managerId: string): Promise<void> {
    const issues = [
      // 需求
      {
        key: 'DEMO_1',
        type: IssueType.requirement,
        title: '用户登录功能需求',
        description: '实现用户登录功能，包括用户名密码登录、记住登录状态等功能',
        state: 'approved',
        priority: 'high',
        assigneeId: managerId,
        reporterId: managerId,
        storyPoints: 8,
        estimatedHours: 16.0,
        actualHours: 12.5,
        labels: ['前端', '后端', '认证'],
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      },
      {
        key: 'DEMO_2',
        type: IssueType.requirement,
        title: '项目管理看板功能',
        description: '实现项目管理的看板视图，支持拖拽操作、状态更新等功能',
        state: 'analyzing',
        priority: 'medium',
        assigneeId: managerId,
        reporterId: managerId,
        storyPoints: 13,
        estimatedHours: 24.0,
        actualHours: null,
        labels: ['前端', 'UI/UX', '项目管理'],
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
      },

      // 任务
      {
        key: 'DEMO_3',
        type: IssueType.task,
        title: '设计登录页面UI',
        description: '设计用户登录页面的界面，包括表单布局、样式等',
        state: 'done',
        priority: 'high',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 3,
        estimatedHours: 4.0,
        actualHours: 3.5,
        parentId: undefined, // 这个任务属于需求DEMO_1
        labels: ['前端', 'UI设计'],
      },
      {
        key: 'DEMO_4',
        type: IssueType.task,
        title: '实现登录API接口',
        description: '开发后端登录API接口，包括用户验证、JWT生成等',
        state: 'in_progress',
        priority: 'high',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 5,
        estimatedHours: 8.0,
        actualHours: 4.0,
        parentId: undefined, // 这个任务属于需求DEMO_1
        labels: ['后端', 'API'],
      },
      {
        key: 'DEMO_5',
        type: IssueType.task,
        title: '前端登录组件开发',
        description: '开发前端登录组件，包括表单验证、状态管理等',
        state: 'testing',
        priority: 'high',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 5,
        estimatedHours: 6.0,
        actualHours: 5.0,
        parentId: undefined, // 这个任务属于需求DEMO_1
        labels: ['前端', 'React'],
      },
      {
        key: 'DEMO_6',
        type: IssueType.task,
        title: '看板组件设计',
        description: '设计看板组件的基本结构和交互方式',
        state: 'todo',
        priority: 'medium',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 8,
        estimatedHours: 12.0,
        actualHours: null,
        parentId: undefined, // 这个任务属于需求DEMO_2
        labels: ['前端', 'UI设计', '组件'],
      },

      // 子任务
      {
        key: 'DEMO_7',
        type: IssueType.task,
        title: '登录表单验证',
        description: '实现登录表单的前端验证逻辑',
        state: 'done',
        priority: 'medium',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 2,
        estimatedHours: 2.0,
        actualHours: 1.5,
        parentId: undefined, // 这个子任务属于任务DEMO_5
        labels: ['前端', '验证'],
      },
      {
        key: 'DEMO_8',
        type: IssueType.task,
        title: 'JWT Token处理',
        description: '实现JWT Token的生成、验证和刷新逻辑',
        state: 'in_progress',
        priority: 'high',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 3,
        estimatedHours: 4.0,
        actualHours: 2.0,
        parentId: undefined, // 这个子任务属于任务DEMO_4
        labels: ['后端', 'JWT', '安全'],
      },

      // Bug
      {
        key: 'DEMO_9',
        type: IssueType.bug,
        title: '登录页面在移动端显示异常',
        description: '在移动设备上，登录页面的表单布局出现错乱',
        state: 'fixing',
        priority: 'high',
        severity: 'major',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 2,
        estimatedHours: 3.0,
        actualHours: 1.0,
        labels: ['前端', '移动端', '布局'],
      },
      {
        key: 'DEMO_10',
        type: IssueType.bug,
        title: 'API接口返回错误状态码',
        description: '登录API在某些情况下返回500错误，需要排查原因',
        state: 'open',
        priority: 'critical',
        severity: 'critical',
        assigneeId: userId,
        reporterId: managerId,
        storyPoints: 3,
        estimatedHours: 4.0,
        actualHours: null,
        labels: ['后端', 'API', '错误处理'],
      },
    ];

    for (const issueData of issues) {
      const existingIssue = await this.issueRepo.findOne({
        where: { key: issueData.key }
      });
      
      if (!existingIssue) {
        await this.issueRepo.save({
          projectId,
          ...issueData,
        });
      }
    }

    this.logger.log('Demo Issues创建成功');
  }
}
