import { Test, TestingModule } from '@nestjs/testing';
import { GitLabApiGitBeakerService } from '../src/modules/gitlab-integration/services/gitlab-api-gitbeaker.service';
import { GitLabInstance } from '../src/modules/gitlab-integration/entities/gitlab-instance.entity';
import { GitLabGroup, GetGroupsOptions } from '../src/modules/gitlab-integration/interfaces/gitlab-api.interface';

describe('GitLabApiGitBeakerService - Groups', () => {
  let service: GitLabApiGitBeakerService;

  const mockGitLabInstance: GitLabInstance = {
    id: 'instance-1',
    name: 'Test GitLab',
    baseUrl: 'https://gitlab.example.com',
    apiToken: 'encrypted-token',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGitLabGroup: GitLabGroup = {
    id: 123,
    name: 'test-group',
    path: 'test-group',
    description: 'Test group',
    visibility: 'private',
    webUrl: 'https://gitlab.example.com/test-group',
    createdAt: new Date(),
    updatedAt: new Date(),
    parentId: undefined,
    fullName: 'Test Group',
    fullPath: 'test-group',
    avatarUrl: 'https://gitlab.example.com/avatar.png',
    lfsEnabled: true,
    requestAccessEnabled: true,
    projectsCount: 5,
    sharedProjectsCount: 0,
    runnersToken: 'token',
    runnersTokenExpiresAt: undefined,
    sharedRunnersEnabled: true,
    sharedWithGroups: [],
    statistics: {
      storageSize: 1024,
      repositorySize: 512,
      lfsObjectsSize: 256,
      jobArtifactsSize: 256,
    },
  };

  const mockGitBeakerResponse = {
    data: [
      {
        id: 123,
        name: 'test-group',
        path: 'test-group',
        description: 'Test group',
        visibility: 'private',
        web_url: 'https://gitlab.example.com/test-group',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        parent_id: null,
        full_name: 'Test Group',
        full_path: 'test-group',
        avatar_url: 'https://gitlab.example.com/avatar.png',
        lfs_enabled: true,
        request_access_enabled: true,
        projects_count: 5,
        shared_projects_count: 0,
        runners_token: 'token',
        runners_token_expires_at: null,
        shared_runners_enabled: true,
        shared_with_groups: [],
        statistics: {
          storage_size: 1024,
          repository_size: 512,
          lfs_objects_size: 256,
          job_artifacts_size: 256,
        },
      },
    ],
    page: 1,
    per_page: 20,
    total: 1,
    total_pages: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitLabApiGitBeakerService],
    }).compile();

    service = module.get<GitLabApiGitBeakerService>(GitLabApiGitBeakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGroups', () => {
    it('should return groups with pagination', async () => {
      // Arrange
      const options: GetGroupsOptions = {
        search: 'test',
        visibility: 'private',
        orderBy: 'name',
        sort: 'asc',
        page: 1,
        perPage: 20,
      };

      // Mock the GitBeaker client
      const mockClient = {
        Groups: {
          all: jest.fn().mockResolvedValue(mockGitBeakerResponse),
        },
      };

      jest.spyOn(service as any, 'createGitLabClient').mockReturnValue(mockClient);

      // Act
      const result = await service.getGroups(mockGitLabInstance, options);

      // Assert
      expect(result).toBeDefined();
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]).toMatchObject({
        id: 123,
        name: 'test-group',
        path: 'test-group',
        description: 'Test group',
        visibility: 'private',
        webUrl: 'https://gitlab.example.com/test-group',
        fullName: 'Test Group',
        fullPath: 'test-group',
        projectsCount: 5,
      });
      expect(result.pagination).toMatchObject({
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
      });
      expect(mockClient.Groups.all).toHaveBeenCalledWith({
        search: 'test',
        visibility: 'private',
        order_by: 'name',
        sort: 'asc',
        page: 1,
        per_page: 20,
      });
    });

    it('should handle empty groups response', async () => {
      // Arrange
      const emptyResponse = {
        data: [],
        page: 1,
        per_page: 20,
        total: 0,
        total_pages: 0,
      };

      const mockClient = {
        Groups: {
          all: jest.fn().mockResolvedValue(emptyResponse),
        },
      };

      jest.spyOn(service as any, 'createGitLabClient').mockReturnValue(mockClient);

      // Act
      const result = await service.getGroups(mockGitLabInstance);

      // Assert
      expect(result).toBeDefined();
      expect(result.groups).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle API errors', async () => {
      // Arrange
      const mockClient = {
        Groups: {
          all: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      };

      jest.spyOn(service as any, 'createGitLabClient').mockReturnValue(mockClient);
      jest.spyOn(service as any, 'handleApiError').mockImplementation((error) => {
        throw error;
      });

      // Act & Assert
      await expect(service.getGroups(mockGitLabInstance))
        .rejects
        .toThrow('API Error');
    });
  });

  describe('getGroup', () => {
    it('should return a specific group', async () => {
      // Arrange
      const mockClient = {
        Groups: {
          show: jest.fn().mockResolvedValue(mockGitBeakerResponse.data[0]),
        },
      };

      jest.spyOn(service as any, 'createGitLabClient').mockReturnValue(mockClient);

      // Act
      const result = await service.getGroup(mockGitLabInstance, 123);

      // Assert
      expect(result).toBeDefined();
      expect(result).toMatchObject({
        id: 123,
        name: 'test-group',
        path: 'test-group',
        description: 'Test group',
        visibility: 'private',
        webUrl: 'https://gitlab.example.com/test-group',
        fullName: 'Test Group',
        fullPath: 'test-group',
        projectsCount: 5,
      });
      expect(mockClient.Groups.show).toHaveBeenCalledWith(123);
    });

    it('should handle group not found', async () => {
      // Arrange
      const mockClient = {
        Groups: {
          show: jest.fn().mockRejectedValue(new Error('Group not found')),
        },
      };

      jest.spyOn(service as any, 'createGitLabClient').mockReturnValue(mockClient);
      jest.spyOn(service as any, 'handleApiError').mockImplementation((error) => {
        throw error;
      });

      // Act & Assert
      await expect(service.getGroup(mockGitLabInstance, 999))
        .rejects
        .toThrow('Group not found');
    });
  });
});
