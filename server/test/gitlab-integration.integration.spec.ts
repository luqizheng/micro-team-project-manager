import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import * as request from 'supertest';
import { GitLabIntegrationModule } from '../src/modules/gitlab-integration/gitlab-integration.module';
import { GitLabInstance } from '../src/modules/gitlab-integration/entities/gitlab-instance.entity';
import { GitLabProjectMapping } from '../src/modules/gitlab-integration/entities/gitlab-project-mapping.entity';
import { GitLabEventLog } from '../src/modules/gitlab-integration/entities/gitlab-event-log.entity';
import { GitLabUserMapping } from '../src/modules/gitlab-integration/entities/gitlab-user-mapping.entity';
import { GitLabSyncStatus } from '../src/modules/gitlab-integration/entities/gitlab-sync-status.entity';

describe('GitLab Integration Integration Tests', () => {
  let app: INestApplication;
  let createdInstanceId: string;
  let createdMappingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            GitLabInstance,
            GitLabProjectMapping,
            GitLabEventLog,
            GitLabUserMapping,
            GitLabSyncStatus,
          ],
          synchronize: true,
        }),
        HttpModule,
        GitLabIntegrationModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GitLab Instance Management', () => {
    it('should create a GitLab instance', async () => {
      const createInstanceDto = {
        name: 'Test GitLab Instance',
        baseUrl: 'https://gitlab.example.com',
        apiToken: 'test-token-123',
        instanceType: 'self_hosted',
        webhookSecret: 'test-webhook-secret',
      };

      const response = await request(app.getHttpServer())
        .post('/gitlab/instances')
        .send(createInstanceDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(createInstanceDto.name);
      expect(response.body.data.baseUrl).toBe(createInstanceDto.baseUrl);
      createdInstanceId = response.body.data.id;
    });

    it('should get all GitLab instances', async () => {
      const response = await request(app.getHttpServer())
        .get('/gitlab/instances')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get a specific GitLab instance', async () => {
      const response = await request(app.getHttpServer())
        .get(`/gitlab/instances/${createdInstanceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdInstanceId);
    });

    it('should update a GitLab instance', async () => {
      const updateDto = {
        name: 'Updated GitLab Instance',
        webhookSecret: 'updated-webhook-secret',
      };

      const response = await request(app.getHttpServer())
        .put(`/gitlab/instances/${createdInstanceId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateDto.name);
    });

    it('should test GitLab instance connection', async () => {
      const response = await request(app.getHttpServer())
        .post(`/gitlab/instances/${createdInstanceId}/test`)
        .expect(200);

      expect(response.body.success).toBeDefined();
      expect(typeof response.body.success).toBe('boolean');
    });
  });

  describe('Project Mapping Management', () => {
    it('should create a project mapping', async () => {
      const createMappingDto = {
        projectId: 'test-project-123',
        gitlabInstanceId: createdInstanceId,
        gitlabProjectId: 456,
        gitlabProjectPath: 'group/test-project',
        syncConfig: {
          syncIssues: true,
          syncMergeRequests: true,
          syncPipelines: false,
        },
        fieldMapping: {
          title: 'title',
          description: 'description',
          assignee: 'assignee',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/gitlab/projects/${createMappingDto.projectId}/mappings`)
        .send(createMappingDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projectId).toBe(createMappingDto.projectId);
      expect(response.body.data.gitlabInstanceId).toBe(createdInstanceId);
      createdMappingId = response.body.data.id;
    });

    it('should get project mappings', async () => {
      const response = await request(app.getHttpServer())
        .get('/gitlab/projects/test-project-123/mappings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update a project mapping', async () => {
      const updateDto = {
        syncConfig: {
          syncIssues: false,
          syncMergeRequests: true,
          syncPipelines: true,
        },
      };

      const response = await request(app.getHttpServer())
        .put(`/gitlab/projects/test-project-123/mappings/${createdMappingId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.syncConfig).toEqual(updateDto.syncConfig);
    });
  });

  describe('Synchronization Management', () => {
    it('should perform incremental sync', async () => {
      const response = await request(app.getHttpServer())
        .post(`/gitlab/sync/incremental/${createdInstanceId}`)
        .send({ projectId: 'test-project-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.syncCount).toBe('number');
    });

    it('should perform full sync', async () => {
      const response = await request(app.getHttpServer())
        .post(`/gitlab/sync/full/${createdInstanceId}`)
        .send({ projectId: 'test-project-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.syncCount).toBe('number');
    });

    it('should sync GitLab users', async () => {
      const response = await request(app.getHttpServer())
        .post(`/gitlab/sync/users/${createdInstanceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.syncedCount).toBe('number');
    });
  });

  describe('Event Management', () => {
    it('should get event statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/gitlab/sync/events/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalEvents');
      expect(response.body.data).toHaveProperty('successfulEvents');
      expect(response.body.data).toHaveProperty('failedEvents');
    });

    it('should get event health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/gitlab/sync/events/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isHealthy');
      expect(response.body.data).toHaveProperty('totalEvents');
    });
  });

  describe('Webhook Processing', () => {
    it('should receive and process webhook events', async () => {
      const webhookPayload = {
        object_kind: 'push',
        project: {
          id: 456,
          name: 'test-project',
          path_with_namespace: 'group/test-project',
        },
        commits: [
          {
            id: 'abc123',
            message: 'Test commit',
            author: {
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        ],
        ref: 'refs/heads/main',
      };

      const response = await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'test-webhook-secret')
        .set('X-Gitlab-Event', 'push')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Webhook事件处理成功');
    });

    it('should reject invalid webhook signature', async () => {
      const webhookPayload = {
        object_kind: 'push',
        project: { id: 456, name: 'test-project' },
      };

      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'invalid-token')
        .set('X-Gitlab-Event', 'push')
        .send(webhookPayload)
        .expect(401);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should get overall statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/gitlab/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('instances');
      expect(response.body.data).toHaveProperty('mappings');
      expect(response.body.data).toHaveProperty('syncTasks');
      expect(response.body.data).toHaveProperty('events');
    });
  });

  describe('Cleanup', () => {
    it('should delete a project mapping', async () => {
      await request(app.getHttpServer())
        .delete(`/gitlab/projects/test-project-123/mappings/${createdMappingId}`)
        .expect(200);
    });

    it('should delete a GitLab instance', async () => {
      await request(app.getHttpServer())
        .delete(`/gitlab/instances/${createdInstanceId}`)
        .expect(200);
    });
  });
});
