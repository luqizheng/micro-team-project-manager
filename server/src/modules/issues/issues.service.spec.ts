import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IssuesService } from './issues.service';
import { IssueEntity } from './issue.entity';
import { ProjectEntity } from '../projects/project.entity';
import { GitLabProjectMapping } from '../gitlab-integration/entities/gitlab-project-mapping.entity';
import { GitLabInstance } from '../gitlab-integration/entities/gitlab-instance.entity';
import { IssueStatesService } from '../issue-states/issue-states.service';
import { GitLabApiGitBeakerService } from '../gitlab-integration/services/gitlab-api-gitbeaker.service';

describe('IssuesService', () => {
  let service: IssuesService;
  let mockIssueRepository: any;
  let mockProjectRepository: any;
  let mockGitlabMappingRepository: any;
  let mockGitlabInstanceRepository: any;
  let mockIssueStatesService: any;
  let mockGitlabApiService: any;

  beforeEach(async () => {
    // 创建模拟的Repository
    mockIssueRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
        getCount: jest.fn().mockResolvedValue(0),
        getRawOne: jest.fn().mockResolvedValue({ totalEstimated: '0', totalActual: '0', maxNumber: 0 }),
      })),
    };

    mockProjectRepository = {
      findOne: jest.fn(),
    };

    mockGitlabMappingRepository = {
      findOne: jest.fn(),
    };

    mockGitlabInstanceRepository = {
      findOne: jest.fn(),
    };

    mockIssueStatesService = {
      findByProjectAndType: jest.fn(),
    };

    mockGitlabApiService = {
      createIssue: jest.fn(),
      updateIssue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuesService,
        {
          provide: getRepositoryToken(IssueEntity),
          useValue: mockIssueRepository,
        },
        {
          provide: getRepositoryToken(ProjectEntity),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(GitLabProjectMapping),
          useValue: mockGitlabMappingRepository,
        },
        {
          provide: getRepositoryToken(GitLabInstance),
          useValue: mockGitlabInstanceRepository,
        },
        {
          provide: IssueStatesService,
          useValue: mockIssueStatesService,
        },
        {
          provide: GitLabApiGitBeakerService,
          useValue: mockGitlabApiService,
        },
      ],
    }).compile();

    service = module.get<IssuesService>(IssuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create issue and sync to GitLab when mapping exists', async () => {
      // 准备测试数据
      const issueData = {
        title: 'Test Issue',
        description: 'Test Description',
        projectId: 'project-1',
        type: 'task' as any,
        state: 'todo',
      };

      const createdIssue = {
        id: 'issue-1',
        key: 'PROJ-1',
        ...issueData,
      };

      const project = {
        id: 'project-1',
        key: 'PROJ',
      };

      const mapping = {
        id: 'mapping-1',
        projectId: 'project-1',
        gitlabInstanceId: 'instance-1',
        gitlabProjectId: 123,
        isActive: true,
      };

      const instance = {
        id: 'instance-1',
        isActive: true,
      };

      const gitlabIssue = {
        id: 456,
        iid: 1,
        title: 'Test Issue',
        description: 'Test Description',
      };

      // 设置模拟返回值
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockIssueRepository.create.mockReturnValue(createdIssue);
      mockIssueRepository.save.mockResolvedValue(createdIssue);
      mockGitlabMappingRepository.findOne.mockResolvedValue(mapping);
      mockGitlabInstanceRepository.findOne.mockResolvedValue(instance);
      mockGitlabApiService.createIssue.mockResolvedValue(gitlabIssue);

      // 执行测试
      const result = await service.create(issueData);

      // 验证结果
      expect(result).toEqual(createdIssue);
      expect(mockIssueRepository.save).toHaveBeenCalledWith(createdIssue);
      expect(mockGitlabMappingRepository.findOne).toHaveBeenCalledWith({
        where: { projectId: 'project-1', isActive: true },
        relations: ['project', 'gitlabInstance'],
      });
      expect(mockGitlabApiService.createIssue).toHaveBeenCalledWith(
        instance,
        123,
        'Test Issue',
        'Test Description',
        undefined,
        ['type:task']
      );
    });

    it('should create issue without GitLab sync when no mapping exists', async () => {
      // 准备测试数据
      const issueData = {
        title: 'Test Issue',
        description: 'Test Description',
        projectId: 'project-1',
        type: 'task' as any,
        state: 'todo',
      };

      const createdIssue = {
        id: 'issue-1',
        key: 'PROJ-1',
        ...issueData,
      };

      const project = {
        id: 'project-1',
        key: 'PROJ',
      };

      // 设置模拟返回值
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockIssueRepository.create.mockReturnValue(createdIssue);
      mockIssueRepository.save.mockResolvedValue(createdIssue);
      mockGitlabMappingRepository.findOne.mockResolvedValue(null);

      // 执行测试
      const result = await service.create(issueData);

      // 验证结果
      expect(result).toEqual(createdIssue);
      expect(mockIssueRepository.save).toHaveBeenCalledWith(createdIssue);
      expect(mockGitlabMappingRepository.findOne).toHaveBeenCalled();
      expect(mockGitlabApiService.createIssue).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update issue and sync to GitLab when mapping exists', async () => {
      // 准备测试数据
      const issueId = 'issue-1';
      const originalIssue = {
        id: 'issue-1',
        key: 'PROJ-1',
        title: 'Original Title',
        description: 'Original Description',
        projectId: 'project-1',
        state: 'todo',
      };

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        state: 'in_progress',
      };

      const updatedIssue = {
        ...originalIssue,
        ...updateData,
      };

      const mapping = {
        id: 'mapping-1',
        projectId: 'project-1',
        gitlabInstanceId: 'instance-1',
        gitlabProjectId: 123,
        isActive: true,
      };

      const instance = {
        id: 'instance-1',
        isActive: true,
      };

      // 设置模拟返回值
      mockIssueRepository.findOne.mockResolvedValue(originalIssue);
      mockIssueRepository.save.mockResolvedValue(updatedIssue);
      mockGitlabMappingRepository.findOne.mockResolvedValue(mapping);
      mockGitlabInstanceRepository.findOne.mockResolvedValue(instance);
      mockGitlabApiService.updateIssue.mockResolvedValue({});

      // 执行测试
      const result = await service.update(issueId, updateData);

      // 验证结果
      expect(result).toEqual(updatedIssue);
      expect(mockIssueRepository.save).toHaveBeenCalledWith(updatedIssue);
      expect(mockGitlabApiService.updateIssue).toHaveBeenCalledWith(
        instance,
        123,
        1, // 从PROJ-1提取的IID
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Description',
          state: 'opened', // 映射后的状态
        })
      );
    });
  });
});
