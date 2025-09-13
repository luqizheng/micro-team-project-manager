import { Test, TestingModule } from '@nestjs/testing';
// import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { GitLabApiService } from './gitlab-api.service';
import { GitLabInstance } from '../entities/gitlab-instance.entity';

describe('GitLabApiService', () => {
  let service: GitLabApiService;
  // let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  const mockInstance: Partial<GitLabInstance> = {
    id: '1',
    name: 'Test Instance',
    baseUrl: 'https://gitlab.example.com',
    apiToken: 'test-token',
    instanceType: 'self_hosted',
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitLabApiService,
        {
          provide: 'HttpService',
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<GitLabApiService>(GitLabApiService);
    // httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test Project' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.testConnection(mockInstance as GitLabInstance);

      expect(result).toBe(true);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/user',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should return false when connection fails', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Connection failed')));

      const result = await service.testConnection(mockInstance as GitLabInstance);

      expect(result).toBe(false);
    });
  });

  describe('getProjects', () => {
    it('should return projects when API call is successful', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', path_with_namespace: 'group/project1' },
        { id: 2, name: 'Project 2', path_with_namespace: 'group/project2' },
      ];

      const mockResponse = {
        data: mockProjects,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getProjects(mockInstance as GitLabInstance);

      expect(result).toEqual(mockProjects);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/projects',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: {
            per_page: 100,
            page: 1,
            simple: true,
          },
        },
      );
    });

    it('should throw error when API call fails', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('API Error')));

      await expect(service.getProjects(mockInstance as GitLabInstance)).rejects.toThrow('API Error');
    });
  });

  describe('getProject', () => {
    it('should return project when API call is successful', async () => {
      const mockProject = {
        id: 1,
        name: 'Test Project',
        path_with_namespace: 'group/test-project',
        description: 'A test project',
      };

      const mockResponse = {
        data: mockProject,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getProject(mockInstance as GitLabInstance, 1);

      expect(result).toEqual(mockProject);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/projects/1',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });

  describe('getIssues', () => {
    it('should return issues when API call is successful', async () => {
      const mockIssues = [
        { id: 1, title: 'Issue 1', state: 'opened' },
        { id: 2, title: 'Issue 2', state: 'closed' },
      ];

      const mockResponse = {
        data: mockIssues,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getIssues(mockInstance as GitLabInstance, 1);

      expect(result).toEqual(mockIssues);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/projects/1/issues',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: {
            per_page: 100,
            page: 1,
            state: 'all',
          },
        },
      );
    });
  });

  describe('getMergeRequests', () => {
    it('should return merge requests when API call is successful', async () => {
      const mockMergeRequests = [
        { id: 1, title: 'MR 1', state: 'opened' },
        { id: 2, title: 'MR 2', state: 'merged' },
      ];

      const mockResponse = {
        data: mockMergeRequests,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getMergeRequests(mockInstance as GitLabInstance, 1);

      expect(result).toEqual(mockMergeRequests);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/projects/1/merge_requests',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: {
            per_page: 100,
            page: 1,
            state: 'all',
          },
        },
      );
    });
  });

  describe('getPipelines', () => {
    it('should return pipelines when API call is successful', async () => {
      const mockPipelines = [
        { id: 1, status: 'success', ref: 'main' },
        { id: 2, status: 'failed', ref: 'develop' },
      ];

      const mockResponse = {
        data: mockPipelines,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPipelines(mockInstance as GitLabInstance, 1);

      expect(result).toEqual(mockPipelines);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/projects/1/pipelines',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: {
            per_page: 100,
            page: 1,
            status: 'all',
          },
        },
      );
    });
  });

  describe('getCommits', () => {
    it('should return commits when API call is successful', async () => {
      const mockCommits = [
        { id: 'abc123', message: 'Initial commit', author_name: 'John Doe' },
        { id: 'def456', message: 'Fix bug', author_name: 'Jane Smith' },
      ];

      const mockResponse = {
        data: mockCommits,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCommits(mockInstance as GitLabInstance, 1);

      expect(result).toEqual(mockCommits);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/projects/1/repository/commits',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: {
            per_page: 100,
            page: 1,
          },
        },
      );
    });
  });

  describe('getUsers', () => {
    it('should return users when API call is successful', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];

      const mockResponse = {
        data: mockUsers,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getUsers(mockInstance as GitLabInstance);

      expect(result).toEqual(mockUsers);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/users',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: {
            per_page: 100,
            page: 1,
            active: true,
          },
        },
      );
    });
  });
});
