import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { GitLabGroupMappingService } from '../src/modules/gitlab-integration/services/gitlab-group-mapping.service';
import { GitLabGroupMapping } from '../src/modules/gitlab-integration/entities/gitlab-group-mapping.entity';
import { ProjectEntity } from '../src/modules/projects/project.entity';
import { GitLabInstance } from '../src/modules/gitlab-integration/entities/gitlab-instance.entity';
import { GitLabApiGitBeakerService } from '../src/modules/gitlab-integration/services/gitlab-api-gitbeaker.service';
import { CreateGroupMappingDto, UpdateGroupMappingDto } from '../src/modules/gitlab-integration/dto';

describe('GitLabGroupMappingService', () => {
  let service: GitLabGroupMappingService;
  let groupMappingRepository: Repository<GitLabGroupMapping>;
  let projectRepository: Repository<ProjectEntity>;
  let gitlabInstanceRepository: Repository<GitLabInstance>;
  let gitlabApiService: GitLabApiGitBeakerService;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    key: 'TEST',
    visibility: 'private' as const,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGitLabInstance = {
    id: 'instance-1',
    name: 'Test GitLab',
    baseUrl: 'https://gitlab.example.com',
    apiToken: 'encrypted-token',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGitLabGroup = {
    id: 123,
    name: 'test-group',
    path: 'test-group',
    description: 'Test group',
    visibility: 'private' as const,
    webUrl: 'https://gitlab.example.com/test-group',
    createdAt: new Date(),
    updatedAt: new Date(),
    fullName: 'Test Group',
    fullPath: 'test-group',
    projectsCount: 5,
    sharedProjectsCount: 0,
    lfsEnabled: true,
    requestAccessEnabled: true,
    runnersToken: 'token',
    sharedRunnersEnabled: true,
    sharedWithGroups: [],
  };

  const mockGroupMapping = {
    id: 'mapping-1',
    projectId: 'project-1',
    gitlabInstanceId: 'instance-1',
    gitlabGroupId: 123,
    gitlabGroupPath: 'test-group',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: mockProject,
    gitlabInstance: mockGitLabInstance,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitLabGroupMappingService,
        {
          provide: getRepositoryToken(GitLabGroupMapping),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProjectEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GitLabInstance),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: GitLabApiGitBeakerService,
          useValue: {
            getGroup: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GitLabGroupMappingService>(GitLabGroupMappingService);
    groupMappingRepository = module.get<Repository<GitLabGroupMapping>>(
      getRepositoryToken(GitLabGroupMapping),
    );
    projectRepository = module.get<Repository<ProjectEntity>>(
      getRepositoryToken(ProjectEntity),
    );
    gitlabInstanceRepository = module.get<Repository<GitLabInstance>>(
      getRepositoryToken(GitLabInstance),
    );
    gitlabApiService = module.get<GitLabApiGitBeakerService>(GitLabApiGitBeakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGroupMapping', () => {
    const createDto: CreateGroupMappingDto = {
      gitlabInstanceId: 'instance-1',
      gitlabGroupId: 123,
      gitlabGroupPath: 'test-group',
      isActive: true,
    };

    it('should create a group mapping successfully', async () => {
      // Arrange
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(gitlabInstanceRepository, 'findOne').mockResolvedValue(mockGitLabInstance);
      jest.spyOn(groupMappingRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(gitlabApiService, 'getGroup').mockResolvedValue(mockGitLabGroup);
      jest.spyOn(groupMappingRepository, 'create').mockReturnValue(mockGroupMapping as any);
      jest.spyOn(groupMappingRepository, 'save').mockResolvedValue(mockGroupMapping as any);

      // Act
      const result = await service.createGroupMapping('project-1', createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.projectId).toBe('project-1');
      expect(result.gitlabGroupId).toBe(123);
      expect(projectRepository.findOne).toHaveBeenCalledWith({ where: { id: 'project-1' } });
      expect(gitlabInstanceRepository.findOne).toHaveBeenCalledWith({ where: { id: 'instance-1' } });
      expect(gitlabApiService.getGroup).toHaveBeenCalledWith(mockGitLabInstance, 123);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      // Arrange
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.createGroupMapping('project-1', createDto))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw NotFoundException when GitLab instance does not exist', async () => {
      // Arrange
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(gitlabInstanceRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.createGroupMapping('project-1', createDto))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw ConflictException when mapping already exists', async () => {
      // Arrange
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(gitlabInstanceRepository, 'findOne').mockResolvedValue(mockGitLabInstance);
      jest.spyOn(groupMappingRepository, 'findOne').mockResolvedValue(mockGroupMapping as any);

      // Act & Assert
      await expect(service.createGroupMapping('project-1', createDto))
        .rejects
        .toThrow(ConflictException);
    });

    it('should throw BadRequestException when GitLab group is not accessible', async () => {
      // Arrange
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(gitlabInstanceRepository, 'findOne').mockResolvedValue(mockGitLabInstance);
      jest.spyOn(groupMappingRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(gitlabApiService, 'getGroup').mockRejectedValue(new Error('Group not found'));

      // Act & Assert
      await expect(service.createGroupMapping('project-1', createDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('getGroupMappingsByProjectId', () => {
    it('should return group mappings for a project', async () => {
      // Arrange
      const mappings = [mockGroupMapping as any];
      jest.spyOn(groupMappingRepository, 'find').mockResolvedValue(mappings);

      // Act
      const result = await service.getGroupMappingsByProjectId('project-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-1');
      expect(groupMappingRepository.find).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        relations: ['gitlabInstance'],
      });
    });
  });

  describe('getGroupMappingById', () => {
    it('should return a group mapping by id', async () => {
      // Arrange
      jest.spyOn(groupMappingRepository, 'findOne').mockResolvedValue(mockGroupMapping as any);

      // Act
      const result = await service.getGroupMappingById('mapping-1');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('mapping-1');
      expect(groupMappingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mapping-1' },
        relations: ['gitlabInstance'],
      });
    });

    it('should throw NotFoundException when mapping does not exist', async () => {
      // Arrange
      jest.spyOn(groupMappingRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.getGroupMappingById('mapping-1'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updateGroupMapping', () => {
    const updateDto: UpdateGroupMappingDto = {
      gitlabGroupPath: 'updated-group',
      isActive: false,
    };

    it('should update a group mapping successfully', async () => {
      // Arrange
      const updatedMapping = { ...mockGroupMapping, ...updateDto };
      jest.spyOn(groupMappingRepository, 'findOne').mockResolvedValue(mockGroupMapping as any);
      jest.spyOn(gitlabApiService, 'getGroup').mockResolvedValue({
        ...mockGitLabGroup,
        fullPath: 'updated-group',
      });
      jest.spyOn(groupMappingRepository, 'save').mockResolvedValue(updatedMapping as any);

      // Act
      const result = await service.updateGroupMapping('mapping-1', updateDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.gitlabGroupPath).toBe('updated-group');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when mapping does not exist', async () => {
      // Arrange
      jest.spyOn(groupMappingRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateGroupMapping('mapping-1', updateDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('deleteGroupMapping', () => {
    it('should delete a group mapping successfully', async () => {
      // Arrange
      jest.spyOn(groupMappingRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      // Act
      await service.deleteGroupMapping('mapping-1');

      // Assert
      expect(groupMappingRepository.delete).toHaveBeenCalledWith('mapping-1');
    });

    it('should throw NotFoundException when mapping does not exist', async () => {
      // Arrange
      jest.spyOn(groupMappingRepository, 'delete').mockResolvedValue({ affected: 0 } as any);

      // Act & Assert
      await expect(service.deleteGroupMapping('mapping-1'))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
