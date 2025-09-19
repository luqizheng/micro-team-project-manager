import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ProjectGroupMappingController } from '../src/modules/gitlab-integration/controllers/project-group-mapping.controller';
import { GitLabGroupMappingService } from '../src/modules/gitlab-integration/services/gitlab-group-mapping.service';
import { CreateGroupMappingDto, UpdateGroupMappingDto, GroupMappingResponseDto } from '../src/modules/gitlab-integration/dto';

describe('ProjectGroupMappingController', () => {
  let controller: ProjectGroupMappingController;
  let service: GitLabGroupMappingService;

  const mockGroupMappingResponse: GroupMappingResponseDto = {
    id: 'mapping-1',
    projectId: 'project-1',
    gitlabInstanceId: 'instance-1',
    gitlabGroupId: 123,
    gitlabGroupPath: 'test-group',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    gitlabInstanceName: 'Test GitLab',
    gitlabInstanceBaseUrl: 'https://gitlab.example.com',
    gitlabGroupWebUrl: 'https://gitlab.example.com/test-group',
  };

  const mockCreateDto: CreateGroupMappingDto = {
    gitlabInstanceId: 'instance-1',
    gitlabGroupId: 123,
    gitlabGroupPath: 'test-group',
    isActive: true,
  };

  const mockUpdateDto: UpdateGroupMappingDto = {
    gitlabGroupPath: 'updated-group',
    isActive: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectGroupMappingController],
      providers: [
        {
          provide: GitLabGroupMappingService,
          useValue: {
            createGroupMapping: jest.fn(),
            getGroupMappingsByProjectId: jest.fn(),
            getGroupMappingById: jest.fn(),
            updateGroupMapping: jest.fn(),
            deleteGroupMapping: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectGroupMappingController>(ProjectGroupMappingController);
    service = module.get<GitLabGroupMappingService>(GitLabGroupMappingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProjectGroupMapping', () => {
    it('should create a project group mapping', async () => {
      // Arrange
      jest.spyOn(service, 'createGroupMapping').mockResolvedValue(mockGroupMappingResponse);

      // Act
      const result = await controller.createProjectGroupMapping('project-1', mockCreateDto);

      // Assert
      expect(result).toBe(mockGroupMappingResponse);
      expect(service.createGroupMapping).toHaveBeenCalledWith('project-1', mockCreateDto);
    });
  });

  describe('getProjectGroupMappings', () => {
    it('should return all group mappings for a project', async () => {
      // Arrange
      const mappings = [mockGroupMappingResponse];
      jest.spyOn(service, 'getGroupMappingsByProjectId').mockResolvedValue(mappings);

      // Act
      const result = await controller.getProjectGroupMappings('project-1');

      // Assert
      expect(result).toBe(mappings);
      expect(service.getGroupMappingsByProjectId).toHaveBeenCalledWith('project-1');
    });
  });

  describe('getProjectGroupMappingById', () => {
    it('should return a specific group mapping', async () => {
      // Arrange
      jest.spyOn(service, 'getGroupMappingById').mockResolvedValue(mockGroupMappingResponse);

      // Act
      const result = await controller.getProjectGroupMappingById('project-1', 'mapping-1');

      // Assert
      expect(result).toBe(mockGroupMappingResponse);
      expect(service.getGroupMappingById).toHaveBeenCalledWith('mapping-1');
    });
  });

  describe('updateProjectGroupMapping', () => {
    it('should update a project group mapping', async () => {
      // Arrange
      const updatedResponse = { ...mockGroupMappingResponse, ...mockUpdateDto };
      jest.spyOn(service, 'updateGroupMapping').mockResolvedValue(updatedResponse);

      // Act
      const result = await controller.updateProjectGroupMapping('project-1', 'mapping-1', mockUpdateDto);

      // Assert
      expect(result).toBe(updatedResponse);
      expect(service.updateGroupMapping).toHaveBeenCalledWith('mapping-1', mockUpdateDto);
    });
  });

  describe('deleteProjectGroupMapping', () => {
    it('should delete a project group mapping', async () => {
      // Arrange
      jest.spyOn(service, 'deleteGroupMapping').mockResolvedValue(undefined);

      // Act
      await controller.deleteProjectGroupMapping('project-1', 'mapping-1');

      // Assert
      expect(service.deleteGroupMapping).toHaveBeenCalledWith('mapping-1');
    });
  });
});
