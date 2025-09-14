import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GitLabIntegrationService } from './gitlab-integration.service';
import { GitLabInstance } from '../entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../entities/gitlab-project-mapping.entity';
import { GitLabApiService } from './gitlab-api.service';

describe('GitLabIntegrationService', () => {
  let service: GitLabIntegrationService;
  let instanceRepository: Repository<GitLabInstance>;
  let mappingRepository: Repository<GitLabProjectMapping>;
  let apiService: GitLabApiService;

  const mockInstanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockMappingRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockApiService = {
    testConnection: jest.fn(),
    getProjects: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitLabIntegrationService,
        {
          provide: getRepositoryToken(GitLabInstance),
          useValue: mockInstanceRepository,
        },
        {
          provide: getRepositoryToken(GitLabProjectMapping),
          useValue: mockMappingRepository,
        },
        {
          provide: GitLabApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    service = module.get<GitLabIntegrationService>(GitLabIntegrationService);
    instanceRepository = module.get<Repository<GitLabInstance>>(getRepositoryToken(GitLabInstance));
    mappingRepository = module.get<Repository<GitLabProjectMapping>>(getRepositoryToken(GitLabProjectMapping));
    apiService = module.get<GitLabApiService>(GitLabApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInstance', () => {
    it('should create a new GitLab instance', async () => {
      const createDto = {
        name: 'Test Instance',
        url: 'https://gitlab.example.com',
        accessToken: 'test-token',
        type: 'self_hosted' as const,
        webhookSecret: 'Test description',
      };

      const mockInstance = {
        id: '1',
        name: createDto.name,
        baseUrl: createDto.url, // DTO的url映射到实体的baseUrl
        apiToken: 'encrypted-token', // 服务层会加密token
        instanceType: createDto.type, // DTO的type映射到实体的instanceType
        webhookSecret: createDto.webhookSecret,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInstanceRepository.create.mockReturnValue(mockInstance);
      mockInstanceRepository.save.mockResolvedValue(mockInstance);

      const result = await service.createInstance(createDto);

      expect(result).toEqual(mockInstance);
      expect(mockInstanceRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        baseUrl: createDto.url,
        apiToken: expect.any(String), // 加密后的token
        webhookSecret: createDto.webhookSecret,
        instanceType: createDto.type,
        isActive: true,
      });
      expect(mockInstanceRepository.save).toHaveBeenCalledWith(mockInstance);
    });
  });

  describe('getAllInstances', () => {
    it('should return all GitLab instances', async () => {
      const mockInstances = [
        { id: '1', name: 'Instance 1', baseUrl: 'https://gitlab1.com' },
        { id: '2', name: 'Instance 2', baseUrl: 'https://gitlab2.com' },
      ];

      mockInstanceRepository.find.mockResolvedValue(mockInstances);

      const result = await service.getAllInstances();

      expect(result).toEqual(mockInstances);
      expect(mockInstanceRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getInstanceById', () => {
    it('should return a GitLab instance by ID', async () => {
      const mockInstance = { id: '1', name: 'Test Instance' };

      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);

      const result = await service.getInstance('1');

      expect(result).toEqual(mockInstance);
      expect(mockInstanceRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when instance not found', async () => {
      mockInstanceRepository.findOne.mockResolvedValue(null);

      const result = await service.getInstance('999');

      expect(result).toBeNull();
    });
  });

  describe('updateInstance', () => {
    it('should update a GitLab instance', async () => {
      const updateDto = { name: 'Updated Instance' };
      const mockInstance = { id: '1', name: 'Updated Instance' };

      mockInstanceRepository.update.mockResolvedValue({ affected: 1 });
      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);

      const result = await service.updateInstance('1', updateDto);

      expect(result).toEqual(mockInstance);
      expect(mockInstanceRepository.update).toHaveBeenCalledWith('1', updateDto);
      expect(mockInstanceRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when instance not found', async () => {
      mockInstanceRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.updateInstance('999', { name: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('deleteInstance', () => {
    it('should soft delete a GitLab instance', async () => {
      mockInstanceRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.deleteInstance('1');

      expect(result).toBe(true);
      expect(mockInstanceRepository.update).toHaveBeenCalledWith('1', { isActive: false });
    });

    it('should return false when instance not found', async () => {
      mockInstanceRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.deleteInstance('999');

      expect(result).toBe(false);
    });
  });

  describe('testInstanceConnection', () => {
    it('should test instance connection successfully', async () => {
      const mockInstance = { id: '1', baseUrl: 'https://gitlab.com', apiToken: 'token' };
      
      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);
      mockApiService.testConnection.mockResolvedValue(true);

      const result = await service.testInstanceConnection('1');

      expect(result).toBe(true);
      expect(mockApiService.testConnection).toHaveBeenCalledWith(mockInstance);
    });

    it('should return false when instance not found', async () => {
      mockInstanceRepository.findOne.mockResolvedValue(null);

      const result = await service.testInstanceConnection('999');

      expect(result).toBe(false);
    });

    it('should return false when connection test fails', async () => {
      const mockInstance = { id: '1', baseUrl: 'https://gitlab.com', apiToken: 'token' };
      
      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);
      mockApiService.testConnection.mockResolvedValue(false);

      const result = await service.testInstanceConnection('1');

      expect(result).toBe(false);
    });
  });

  describe('getInstanceProjects', () => {
    it('should return GitLab projects for an instance', async () => {
      const mockInstance = { id: '1', baseUrl: 'https://gitlab.com', apiToken: 'token' };
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' },
      ];

      mockInstanceRepository.findOne.mockResolvedValue(mockInstance);
      mockApiService.getProjects.mockResolvedValue(mockProjects);

      const result = await service.getProjectMappings('1');

      expect(result).toEqual(mockProjects);
      expect(mockApiService.getProjects).toHaveBeenCalledWith(mockInstance);
    });

    it('should return empty array when instance not found', async () => {
      mockInstanceRepository.findOne.mockResolvedValue(null);

      const result = await service.getProjectMappings('999');

      expect(result).toEqual([]);
    });
  });

  describe('createProjectMapping', () => {
    it('should create a new project mapping', async () => {
      const createDto = {
        projectId: 'proj-1',
        gitlabInstanceId: 'inst-1',
        gitlabProjectId: 123,
        gitlabProjectPath: 'group/project',
        syncConfig: { syncIssues: true },
        fieldMapping: { title: 'title' },
      };

      const mockMapping = {
        id: '1',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMappingRepository.create.mockReturnValue(mockMapping);
      mockMappingRepository.save.mockResolvedValue(mockMapping);

      const result = await service.createProjectMapping("test-project", createDto);

      expect(result).toEqual(mockMapping);
      expect(mockMappingRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockMappingRepository.save).toHaveBeenCalledWith(mockMapping);
    });
  });

  describe('getProjectMappings', () => {
    it('should return project mappings for a project', async () => {
      const mockMappings = [
        { id: '1', projectId: 'proj-1', gitlabProjectId: '123' },
        { id: '2', projectId: 'proj-1', gitlabProjectId: '456' },
      ];

      mockMappingRepository.find.mockResolvedValue(mockMappings);

      const result = await service.getProjectMappings('proj-1');

      expect(result).toEqual(mockMappings);
      expect(mockMappingRepository.find).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', isActive: true },
        relations: ['gitlabInstance', 'project'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateProjectMapping', () => {
    it('should update a project mapping', async () => {
      const updateDto = { syncConfig: { syncIssues: false } };
      const mockMapping = { id: '1', projectId: 'proj-1', syncConfig: { syncIssues: false } };

      mockMappingRepository.update.mockResolvedValue({ affected: 1 });
      mockMappingRepository.findOne.mockResolvedValue(mockMapping);

      const result = await service.updateProjectMapping('proj-1', '1', updateDto);

      expect(result).toEqual(mockMapping);
      expect(mockMappingRepository.update).toHaveBeenCalledWith(
        { id: '1', projectId: 'proj-1' },
        updateDto,
      );
    });
  });

  describe('deleteProjectMapping', () => {
    it('should soft delete a project mapping', async () => {
      mockMappingRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.deleteProjectMapping('proj-1', '1');

      expect(result).toBe(true);
      expect(mockMappingRepository.update).toHaveBeenCalledWith(
        { id: '1', projectId: 'proj-1' },
        { isActive: false },
      );
    });
  });
});
