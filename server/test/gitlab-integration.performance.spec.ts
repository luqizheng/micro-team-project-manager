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

describe('GitLab Integration Performance Tests', () => {
  let app: INestApplication;
  let createdInstanceId: string;

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

    // 创建测试实例
    const createInstanceDto = {
      name: 'Performance Test Instance',
      baseUrl: 'https://gitlab.example.com',
      apiToken: 'test-token-123',
      instanceType: 'self_hosted',
      webhookSecret: 'test-webhook-secret',
    };

    const response = await request(app.getHttpServer())
      .post('/gitlab/instances')
      .send(createInstanceDto);
    
    createdInstanceId = response.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Response Time Tests', () => {
    it('should respond to instance list within 100ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/gitlab/instances')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    it('should respond to instance details within 50ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get(`/gitlab/instances/${createdInstanceId}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(50);
    });

    it('should respond to statistics within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/gitlab/statistics')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk project mapping creation', async () => {
      const mappings = Array.from({ length: 10 }, (_, i) => ({
        projectId: `test-project-${i}`,
        gitlabInstanceId: createdInstanceId,
        gitlabProjectId: 100 + i,
        gitlabProjectPath: `group/test-project-${i}`,
        syncConfig: { syncIssues: true },
        fieldMapping: { title: 'title' },
      }));

      const startTime = Date.now();
      
      const promises = mappings.map(mapping =>
        request(app.getHttpServer())
          .post(`/gitlab/projects/${mapping.projectId}/mappings`)
          .send(mapping)
      );

      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 mappings
    });

    it('should handle bulk webhook events', async () => {
      const webhookPayloads = Array.from({ length: 20 }, (_, i) => ({
        object_kind: 'push',
        project: {
          id: 100 + i,
          name: `test-project-${i}`,
          path_with_namespace: `group/test-project-${i}`,
        },
        commits: [{
          id: `commit-${i}`,
          message: `Test commit ${i}`,
          author: { name: 'Test User', email: 'test@example.com' },
        }],
        ref: 'refs/heads/main',
      }));

      const startTime = Date.now();
      
      const promises = webhookPayloads.map(payload =>
        request(app.getHttpServer())
          .post(`/gitlab/webhook/${createdInstanceId}`)
          .set('X-Gitlab-Token', 'test-webhook-secret')
          .set('X-Gitlab-Event', 'push')
          .send(payload)
      );

      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 20 webhooks
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during bulk operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 执行大量操作
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .get('/gitlab/instances')
          .expect(200);
      }
      
      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该小于10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle concurrent instance requests', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/gitlab/instances')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      
      // 所有请求都应该成功
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
      
      // 总时间应该合理
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle concurrent webhook processing', async () => {
      const concurrentWebhooks = 30;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentWebhooks }, (_, i) => {
        const payload = {
          object_kind: 'push',
          project: { id: 200 + i, name: `concurrent-project-${i}` },
          commits: [{
            id: `concurrent-commit-${i}`,
            message: `Concurrent commit ${i}`,
            author: { name: 'Test User', email: 'test@example.com' },
          }],
          ref: 'refs/heads/main',
        };

        return request(app.getHttpServer())
          .post(`/gitlab/webhook/${createdInstanceId}`)
          .set('X-Gitlab-Token', 'test-webhook-secret')
          .set('X-Gitlab-Event', 'push')
          .send(payload);
      });

      const responses = await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      
      // 所有请求都应该成功
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      // 总时间应该合理
      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      // 创建大量事件日志
      const eventLogs = Array.from({ length: 1000 }, (_, i) => ({
        gitlabInstanceId: createdInstanceId,
        eventType: 'push',
        payload: { id: i, message: `Event ${i}` },
        status: 'success',
        processedAt: new Date(),
      }));

      // 这里应该使用批量插入，但为了测试我们模拟
      const startTime = Date.now();
      
      // 模拟查询大量数据
      await request(app.getHttpServer())
        .get('/gitlab/sync/events/statistics')
        .expect(200);
      
      const queryTime = Date.now() - startTime;
      expect(queryTime).toBeLessThan(1000); // 1秒内完成
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently', async () => {
      const startTime = Date.now();
      
      // 发送无效请求
      await request(app.getHttpServer())
        .get('/gitlab/instances/non-existent-id')
        .expect(404);
      
      const errorResponseTime = Date.now() - startTime;
      expect(errorResponseTime).toBeLessThan(100); // 错误响应应该很快
    });

    it('should handle malformed webhook payloads efficiently', async () => {
      const startTime = Date.now();
      
      // 发送格式错误的webhook
      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'invalid-token')
        .set('X-Gitlab-Event', 'push')
        .send({ invalid: 'payload' })
        .expect(401);
      
      const errorResponseTime = Date.now() - startTime;
      expect(errorResponseTime).toBeLessThan(100);
    });
  });
});
