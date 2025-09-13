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

describe('GitLab Integration (e2e)', () => {
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

  describe('/gitlab/instances (POST)', () => {
    it('should create a new GitLab instance', () => {
      const createInstanceDto = {
        name: 'Test GitLab Instance',
        url: 'https://gitlab.example.com',
        accessToken: 'test-token-123',
        type: 'self_hosted',
        description: 'Test instance for e2e testing',
        webhookSecret: 'test-webhook-secret',
      };

      return request(app.getHttpServer())
        .post('/gitlab/instances')
        .send(createInstanceDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe(createInstanceDto.name);
          expect(res.body.data.url).toBe(createInstanceDto.url);
          expect(res.body.data.type).toBe(createInstanceDto.type);
          createdInstanceId = res.body.data.id;
        });
    });

    it('should return 400 for invalid instance data', () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        url: 'invalid-url', // Invalid: not a valid URL
        accessToken: '', // Invalid: empty token
      };

      return request(app.getHttpServer())
        .post('/gitlab/instances')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/gitlab/instances (GET)', () => {
    it('should return all GitLab instances', () => {
      return request(app.getHttpServer())
        .get('/gitlab/instances')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/gitlab/instances/:id (GET)', () => {
    it('should return a specific GitLab instance', () => {
      return request(app.getHttpServer())
        .get(`/gitlab/instances/${createdInstanceId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(createdInstanceId);
        });
    });

    it('should return 404 for non-existent instance', () => {
      return request(app.getHttpServer())
        .get('/gitlab/instances/non-existent-id')
        .expect(404);
    });
  });

  describe('/gitlab/instances/:id (PUT)', () => {
    it('should update a GitLab instance', () => {
      const updateDto = {
        name: 'Updated GitLab Instance',
        description: 'Updated description',
      };

      return request(app.getHttpServer())
        .put(`/gitlab/instances/${createdInstanceId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe(updateDto.name);
          expect(res.body.data.description).toBe(updateDto.description);
        });
    });
  });

  describe('/gitlab/instances/:id/test (POST)', () => {
    it('should test GitLab instance connection', () => {
      return request(app.getHttpServer())
        .post(`/gitlab/instances/${createdInstanceId}/test`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBeDefined();
          expect(typeof res.body.success).toBe('boolean');
        });
    });
  });

  describe('/gitlab/projects/:projectId/mappings (POST)', () => {
    it('should create a new project mapping', () => {
      const createMappingDto = {
        projectId: 'test-project-123',
        gitlabInstanceId: createdInstanceId,
        gitlabProjectId: '456',
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

      return request(app.getHttpServer())
        .post(`/gitlab/projects/${createMappingDto.projectId}/mappings`)
        .send(createMappingDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.projectId).toBe(createMappingDto.projectId);
          expect(res.body.data.gitlabInstanceId).toBe(createdInstanceId);
          createdMappingId = res.body.data.id;
        });
    });
  });

  describe('/gitlab/projects/:projectId/mappings (GET)', () => {
    it('should return project mappings', () => {
      return request(app.getHttpServer())
        .get('/gitlab/projects/test-project-123/mappings')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/gitlab/projects/:projectId/mappings/:mappingId (PUT)', () => {
    it('should update a project mapping', () => {
      const updateDto = {
        syncConfig: {
          syncIssues: false,
          syncMergeRequests: true,
          syncPipelines: true,
        },
      };

      return request(app.getHttpServer())
        .put(`/gitlab/projects/test-project-123/mappings/${createdMappingId}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.syncConfig).toEqual(updateDto.syncConfig);
        });
    });
  });

  describe('/gitlab/sync/incremental/:instanceId (POST)', () => {
    it('should perform incremental sync', () => {
      return request(app.getHttpServer())
        .post(`/gitlab/sync/incremental/${createdInstanceId}`)
        .send({ projectId: 'test-project-123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(typeof res.body.syncCount).toBe('number');
        });
    });
  });

  describe('/gitlab/sync/full/:instanceId (POST)', () => {
    it('should perform full sync', () => {
      return request(app.getHttpServer())
        .post(`/gitlab/sync/full/${createdInstanceId}`)
        .send({ projectId: 'test-project-123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(typeof res.body.syncCount).toBe('number');
        });
    });
  });

  describe('/gitlab/sync/users/:instanceId (POST)', () => {
    it('should sync GitLab users', () => {
      return request(app.getHttpServer())
        .post(`/gitlab/sync/users/${createdInstanceId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(typeof res.body.syncedCount).toBe('number');
        });
    });
  });

  describe('/gitlab/sync/events/statistics (GET)', () => {
    it('should return event statistics', () => {
      return request(app.getHttpServer())
        .get('/gitlab/sync/events/statistics')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('totalEvents');
          expect(res.body.data).toHaveProperty('successfulEvents');
          expect(res.body.data).toHaveProperty('failedEvents');
        });
    });
  });

  describe('/gitlab/statistics (GET)', () => {
    it('should return overall statistics', () => {
      return request(app.getHttpServer())
        .get('/gitlab/statistics')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('instances');
          expect(res.body.data).toHaveProperty('mappings');
          expect(res.body.data).toHaveProperty('syncTasks');
          expect(res.body.data).toHaveProperty('events');
        });
    });
  });

  describe('/gitlab/webhook/:instanceId (POST)', () => {
    it('should receive and process webhook events', () => {
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

      return request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'test-webhook-secret')
        .set('X-Gitlab-Event', 'push')
        .send(webhookPayload)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Webhook事件处理成功');
        });
    });

    it('should return 401 for invalid webhook signature', () => {
      const webhookPayload = {
        object_kind: 'push',
        project: { id: 456, name: 'test-project' },
      };

      return request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'invalid-token')
        .set('X-Gitlab-Event', 'push')
        .send(webhookPayload)
        .expect(401);
    });
  });

  describe('/gitlab/projects/:projectId/mappings/:mappingId (DELETE)', () => {
    it('should delete a project mapping', () => {
      return request(app.getHttpServer())
        .delete(`/gitlab/projects/test-project-123/mappings/${createdMappingId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/gitlab/instances/:id (DELETE)', () => {
    it('should delete a GitLab instance', () => {
      return request(app.getHttpServer())
        .delete(`/gitlab/instances/${createdInstanceId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});
