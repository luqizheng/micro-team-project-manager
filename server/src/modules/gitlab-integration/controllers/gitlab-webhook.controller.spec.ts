import { Test, TestingModule } from '@nestjs/testing';
import { GitLabWebhookController } from './gitlab-webhook.controller';
import { GitLabWebhookService } from '../services/gitlab-webhook.service';
import { GitLabEventProcessorService } from '../services/gitlab-event-processor.service';

describe('GitLabWebhookController', () => {
  let controller: GitLabWebhookController;
  let webhookService: GitLabWebhookService;
  let eventProcessorService: GitLabEventProcessorService;

  const mockWebhookService = {
    verifyWebhookSignature: jest.fn(),
    processWebhookEvent: jest.fn(),
    getEventLogs: jest.fn(),
  };

  const mockEventProcessorService = {
    processEvent: jest.fn(),
    getEventStatistics: jest.fn(),
    retryEvent: jest.fn(),
    batchRetryEvents: jest.fn(),
    getEventHealthStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GitLabWebhookController],
      providers: [
        {
          provide: GitLabWebhookService,
          useValue: mockWebhookService,
        },
        {
          provide: GitLabEventProcessorService,
          useValue: mockEventProcessorService,
        },
      ],
    }).compile();

    controller = module.get<GitLabWebhookController>(GitLabWebhookController);
    webhookService = module.get<GitLabWebhookService>(GitLabWebhookService);
    eventProcessorService = module.get<GitLabEventProcessorService>(GitLabEventProcessorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('receiveWebhook', () => {
    const mockRequest = {
      headers: {
        'x-gitlab-token': 'test-token',
        'x-gitlab-event': 'push',
      },
      body: {
        object_kind: 'push',
        project: { id: 123, name: 'test-project' },
        commits: [{ id: 'abc123', message: 'Test commit' }],
      },
    };

    it('should process webhook event successfully', async () => {
      mockWebhookService.verifyWebhookSignature.mockReturnValue(true);
      mockWebhookService.processWebhookEvent.mockResolvedValue({
        success: true,
        eventId: 'event-123',
      });

      const result = await controller.receiveWebhook('instance-1', mockRequest);

      expect(result).toEqual({
        success: true,
        message: 'Webhook事件处理成功',
        eventId: 'event-123',
      });
      expect(mockWebhookService.verifyWebhookSignature).toHaveBeenCalledWith(
        'instance-1',
        mockRequest.headers,
        mockRequest.body,
      );
      expect(mockWebhookService.processWebhookEvent).toHaveBeenCalledWith(
        'instance-1',
        mockRequest.body,
      );
    });

    it('should return error when signature verification fails', async () => {
      mockWebhookService.verifyWebhookSignature.mockReturnValue(false);

      const result = await controller.receiveWebhook('instance-1', mockRequest);

      expect(result).toEqual({
        success: false,
        message: 'Webhook签名验证失败',
      });
      expect(mockWebhookService.processWebhookEvent).not.toHaveBeenCalled();
    });

    it('should return error when event processing fails', async () => {
      mockWebhookService.verifyWebhookSignature.mockReturnValue(true);
      mockWebhookService.processWebhookEvent.mockResolvedValue({
        success: false,
        error: 'Processing failed',
      });

      const result = await controller.receiveWebhook('instance-1', mockRequest);

      expect(result).toEqual({
        success: false,
        message: 'Webhook事件处理失败: Processing failed',
      });
    });
  });

  describe('getEventLogs', () => {
    it('should return event logs for an instance', async () => {
      const mockLogs = [
        {
          id: '1',
          eventType: 'push',
          status: 'success',
          createdAt: new Date(),
        },
        {
          id: '2',
          eventType: 'merge_request',
          status: 'failed',
          createdAt: new Date(),
        },
      ];

      mockWebhookService.getEventLogs.mockResolvedValue(mockLogs);

      const result = await controller.getEventLogs('instance-1', {
        page: 1,
        limit: 10,
        eventType: 'push',
        status: 'success',
      });

      expect(result).toEqual({
        success: true,
        data: mockLogs,
        pagination: {
          page: 1,
          limit: 10,
          total: mockLogs.length,
        },
      });
      expect(mockWebhookService.getEventLogs).toHaveBeenCalledWith('instance-1', {
        page: 1,
        limit: 10,
        eventType: 'push',
        status: 'success',
      });
    });
  });

  describe('getEventStatistics', () => {
    it('should return event statistics', async () => {
      const mockStats = {
        totalEvents: 100,
        successfulEvents: 95,
        failedEvents: 5,
        processingEvents: 0,
        todayEvents: 10,
        successRate: 95,
      };

      mockEventProcessorService.getEventStatistics.mockResolvedValue(mockStats);

      const result = await controller.getEventStatistics();

      expect(result).toEqual({
        success: true,
        data: mockStats,
      });
      expect(mockEventProcessorService.getEventStatistics).toHaveBeenCalled();
    });
  });

  describe('retryEvent', () => {
    it('should retry an event successfully', async () => {
      mockEventProcessorService.retryEvent.mockResolvedValue({
        success: true,
        message: 'Event retry initiated',
      });

      const result = await controller.retryEvent('event-123');

      expect(result).toEqual({
        success: true,
        message: 'Event retry initiated',
      });
      expect(mockEventProcessorService.retryEvent).toHaveBeenCalledWith('event-123');
    });

    it('should return error when retry fails', async () => {
      mockEventProcessorService.retryEvent.mockResolvedValue({
        success: false,
        error: 'Event not found',
      });

      const result = await controller.retryEvent('event-999');

      expect(result).toEqual({
        success: false,
        message: 'Event retry failed: Event not found',
      });
    });
  });

  describe('batchRetryEvents', () => {
    it('should retry multiple events successfully', async () => {
      const eventIds = ['event-1', 'event-2', 'event-3'];
      
      mockEventProcessorService.batchRetryEvents.mockResolvedValue({
        success: true,
        message: 'Batch retry initiated',
        retryCount: 3,
      });

      const result = await controller.batchRetryEvents({ eventIds });

      expect(result).toEqual({
        success: true,
        message: 'Batch retry initiated',
        retryCount: 3,
      });
      expect(mockEventProcessorService.batchRetryEvents).toHaveBeenCalledWith(eventIds);
    });
  });

  describe('getEventHealthStatus', () => {
    it('should return event health status', async () => {
      const mockHealth = {
        isHealthy: true,
        totalEvents: 100,
        failedEvents: 5,
        successRate: 95,
        lastProcessedAt: new Date(),
        queueSize: 0,
      };

      mockEventProcessorService.getEventHealthStatus.mockResolvedValue(mockHealth);

      const result = await controller.getEventHealthStatus();

      expect(result).toEqual({
        success: true,
        data: mockHealth,
      });
      expect(mockEventProcessorService.getEventHealthStatus).toHaveBeenCalled();
    });
  });
});
