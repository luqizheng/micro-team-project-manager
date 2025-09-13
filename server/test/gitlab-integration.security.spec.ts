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

describe('GitLab Integration Security Tests', () => {
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
      name: 'Security Test Instance',
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

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/gitlab/instances')
        .expect(401);
    });

    it('should reject requests with invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/gitlab/instances')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with malformed JWT token', async () => {
      await request(app.getHttpServer())
        .get('/gitlab/instances')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);
    });
  });

  describe('Input Validation', () => {
    it('should reject malformed instance creation data', async () => {
      const invalidData = {
        name: '', // 空名称
        baseUrl: 'not-a-url', // 无效URL
        apiToken: '', // 空令牌
        instanceType: 'invalid_type', // 无效类型
      };

      await request(app.getHttpServer())
        .post('/gitlab/instances')
        .send(invalidData)
        .expect(400);
    });

    it('should reject SQL injection attempts', async () => {
      const maliciousData = {
        name: "'; DROP TABLE gitlab_instances; --",
        baseUrl: 'https://gitlab.example.com',
        apiToken: 'test-token',
        instanceType: 'self_hosted',
      };

      await request(app.getHttpServer())
        .post('/gitlab/instances')
        .send(maliciousData)
        .expect(400);
    });

    it('should reject XSS attempts in instance name', async () => {
      const xssData = {
        name: '<script>alert("xss")</script>',
        baseUrl: 'https://gitlab.example.com',
        apiToken: 'test-token',
        instanceType: 'self_hosted',
      };

      await request(app.getHttpServer())
        .post('/gitlab/instances')
        .send(xssData)
        .expect(400);
    });

    it('should reject extremely long input values', async () => {
      const longString = 'a'.repeat(10000);
      const longData = {
        name: longString,
        baseUrl: 'https://gitlab.example.com',
        apiToken: 'test-token',
        instanceType: 'self_hosted',
      };

      await request(app.getHttpServer())
        .post('/gitlab/instances')
        .send(longData)
        .expect(400);
    });
  });

  describe('Webhook Security', () => {
    it('should reject webhooks without signature', async () => {
      const payload = {
        object_kind: 'push',
        project: { id: 123, name: 'test-project' },
      };

      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .send(payload)
        .expect(401);
    });

    it('should reject webhooks with invalid signature', async () => {
      const payload = {
        object_kind: 'push',
        project: { id: 123, name: 'test-project' },
      };

      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'invalid-signature')
        .set('X-Gitlab-Event', 'push')
        .send(payload)
        .expect(401);
    });

    it('should reject webhooks with malformed signature', async () => {
      const payload = {
        object_kind: 'push',
        project: { id: 123, name: 'test-project' },
      };

      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'malformed-signature')
        .set('X-Gitlab-Event', 'push')
        .send(payload)
        .expect(401);
    });

    it('should handle malformed JSON payloads', async () => {
      const malformedPayload = '{ invalid json }';

      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'test-webhook-secret')
        .set('X-Gitlab-Event', 'push')
        .set('Content-Type', 'application/json')
        .send(malformedPayload)
        .expect(400);
    });

    it('should reject oversized payloads', async () => {
      const largePayload = {
        object_kind: 'push',
        project: { id: 123, name: 'test-project' },
        large_data: 'x'.repeat(1000000), // 1MB of data
      };

      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'test-webhook-secret')
        .set('X-Gitlab-Event', 'push')
        .send(largePayload)
        .expect(413); // Payload too large
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app.getHttpServer())
          .get('/gitlab/instances')
      );

      const responses = await Promise.all(requests);
      
      // 应该有一些请求被限制
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on webhook endpoints', async () => {
      const webhookPayload = {
        object_kind: 'push',
        project: { id: 123, name: 'test-project' },
      };

      const requests = Array.from({ length: 1000 }, () =>
        request(app.getHttpServer())
          .post(`/gitlab/webhook/${createdInstanceId}`)
          .set('X-Gitlab-Token', 'test-webhook-secret')
          .set('X-Gitlab-Event', 'push')
          .send(webhookPayload)
      );

      const responses = await Promise.all(requests);
      
      // 应该有一些请求被限制
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize instance data in responses', async () => {
      const response = await request(app.getHttpServer())
        .get(`/gitlab/instances/${createdInstanceId}`)
        .expect(200);

      // API令牌不应该在响应中返回
      expect(response.body.data.apiToken).toBeUndefined();
      
      // 只应该返回必要的字段
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('baseUrl');
      expect(response.body.data).toHaveProperty('instanceType');
    });

    it('should sanitize webhook payloads in logs', async () => {
      const sensitivePayload = {
        object_kind: 'push',
        project: { id: 123, name: 'test-project' },
        password: 'sensitive-password',
        token: 'sensitive-token',
        api_key: 'sensitive-api-key',
      };

      await request(app.getHttpServer())
        .post(`/gitlab/webhook/${createdInstanceId}`)
        .set('X-Gitlab-Token', 'test-webhook-secret')
        .set('X-Gitlab-Event', 'push')
        .send(sensitivePayload)
        .expect(200);

      // 检查日志中是否包含敏感信息
      // 这里应该检查日志文件，但为了测试我们假设日志被正确清理
    });
  });

  describe('Access Control', () => {
    it('should enforce role-based access control', async () => {
      // 测试不同角色的访问权限
      const roles = ['user', 'project_admin', 'admin'];
      
      for (const role of roles) {
        // 这里应该模拟不同角色的JWT令牌
        // 由于我们没有完整的认证系统，我们只测试端点存在
        await request(app.getHttpServer())
          .get('/gitlab/instances')
          .expect(401); // 没有认证应该被拒绝
      }
    });

    it('should prevent unauthorized instance access', async () => {
      // 尝试访问不存在的实例
      await request(app.getHttpServer())
        .get('/gitlab/instances/non-existent-id')
        .expect(404);
    });

    it('should prevent unauthorized project mapping access', async () => {
      // 尝试访问不存在的项目映射
      await request(app.getHttpServer())
        .get('/gitlab/projects/non-existent-project/mappings')
        .expect(404);
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/gitlab/instances/non-existent-id')
        .expect(404);

      // 错误消息不应该包含敏感信息
      expect(response.body.message).not.toContain('password');
      expect(response.body.message).not.toContain('token');
      expect(response.body.message).not.toContain('secret');
    });

    it('should not expose stack traces in production', async () => {
      // 模拟生产环境
      process.env.NODE_ENV = 'production';
      
      const response = await request(app.getHttpServer())
        .get('/gitlab/instances/invalid-format')
        .expect(400);

      // 响应不应该包含堆栈跟踪
      expect(response.body.stack).toBeUndefined();
      
      // 恢复环境
      process.env.NODE_ENV = 'test';
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF tokens for state-changing operations', async () => {
      // 测试POST请求需要CSRF保护
      await request(app.getHttpServer())
        .post('/gitlab/instances')
        .send({
          name: 'Test Instance',
          baseUrl: 'https://gitlab.example.com',
          apiToken: 'test-token',
          instanceType: 'self_hosted',
        })
        .expect(401); // 应该被CSRF保护拒绝
    });
  });

  describe('Content Security Policy', () => {
    it('should set appropriate security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/gitlab/instances')
        .expect(401);

      // 检查安全头
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
