-- GitLab集成功能数据库表结构设计
-- 基于现有schema扩展，支持GitLab Self-hosted集成

-- 1. GitLab实例配置表
CREATE TABLE gitlab_instances (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '实例名称',
  base_url VARCHAR(500) NOT NULL COMMENT 'GitLab实例基础URL',
  api_token VARCHAR(500) NOT NULL COMMENT 'API访问令牌（加密存储）',
  webhook_secret VARCHAR(128) COMMENT 'Webhook签名密钥',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  instance_type ENUM('self_hosted', 'gitlab_com') DEFAULT 'self_hosted' COMMENT '实例类型',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引
  INDEX idx_gitlab_instances_active (is_active),
  INDEX idx_gitlab_instances_type (instance_type),
  INDEX idx_gitlab_instances_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GitLab实例配置表';

-- 2. GitLab项目映射表
CREATE TABLE gitlab_project_mappings (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL COMMENT '项目管理工具项目ID',
  gitlab_instance_id VARCHAR(36) NOT NULL COMMENT 'GitLab实例ID',
  gitlab_project_id INT NOT NULL COMMENT 'GitLab项目ID',
  gitlab_project_path VARCHAR(500) NOT NULL COMMENT 'GitLab项目路径',
  webhook_id VARCHAR(36) COMMENT 'GitLab Webhook ID',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 外键约束
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (gitlab_instance_id) REFERENCES gitlab_instances(id) ON DELETE CASCADE,
  
  -- 唯一约束
  UNIQUE KEY unique_mapping (project_id, gitlab_instance_id, gitlab_project_id),
  
  -- 索引
  INDEX idx_gitlab_mappings_project (project_id),
  INDEX idx_gitlab_mappings_instance (gitlab_instance_id),
  INDEX idx_gitlab_mappings_gitlab_project (gitlab_project_id),
  INDEX idx_gitlab_mappings_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GitLab项目映射表';

-- 3. GitLab事件日志表
CREATE TABLE gitlab_event_logs (
  id VARCHAR(36) PRIMARY KEY,
  gitlab_instance_id VARCHAR(36) NOT NULL COMMENT 'GitLab实例ID',
  event_type VARCHAR(50) NOT NULL COMMENT '事件类型',
  event_data JSON NOT NULL COMMENT '事件数据',
  processed BOOLEAN DEFAULT FALSE COMMENT '是否已处理',
  error_message TEXT COMMENT '错误信息',
  retry_count INT DEFAULT 0 COMMENT '重试次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  processed_at TIMESTAMP NULL COMMENT '处理时间',
  
  -- 外键约束
  FOREIGN KEY (gitlab_instance_id) REFERENCES gitlab_instances(id) ON DELETE CASCADE,
  
  -- 索引
  INDEX idx_gitlab_events_instance (gitlab_instance_id),
  INDEX idx_gitlab_events_type (event_type),
  INDEX idx_gitlab_events_processed (processed),
  INDEX idx_gitlab_events_created_at (created_at),
  INDEX idx_gitlab_events_retry (retry_count, processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GitLab事件日志表';

-- 4. GitLab用户映射表（可选，用于用户同步）
CREATE TABLE gitlab_user_mappings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL COMMENT '项目管理工具用户ID',
  gitlab_instance_id VARCHAR(36) NOT NULL COMMENT 'GitLab实例ID',
  gitlab_user_id INT NOT NULL COMMENT 'GitLab用户ID',
  gitlab_username VARCHAR(255) NOT NULL COMMENT 'GitLab用户名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 外键约束
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gitlab_instance_id) REFERENCES gitlab_instances(id) ON DELETE CASCADE,
  
  -- 唯一约束
  UNIQUE KEY unique_user_mapping (user_id, gitlab_instance_id),
  UNIQUE KEY unique_gitlab_user (gitlab_instance_id, gitlab_user_id),
  
  -- 索引
  INDEX idx_gitlab_user_mappings_user (user_id),
  INDEX idx_gitlab_user_mappings_instance (gitlab_instance_id),
  INDEX idx_gitlab_user_mappings_gitlab_user (gitlab_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GitLab用户映射表';

-- 5. GitLab同步状态表（用于跟踪同步状态）
CREATE TABLE gitlab_sync_status (
  id VARCHAR(36) PRIMARY KEY,
  mapping_id VARCHAR(36) NOT NULL COMMENT '项目映射ID',
  last_sync_at TIMESTAMP NULL COMMENT '最后同步时间',
  sync_status ENUM('success', 'failed', 'in_progress') DEFAULT 'in_progress' COMMENT '同步状态',
  error_message TEXT COMMENT '错误信息',
  sync_count INT DEFAULT 0 COMMENT '同步次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 外键约束
  FOREIGN KEY (mapping_id) REFERENCES gitlab_project_mappings(id) ON DELETE CASCADE,
  
  -- 唯一约束
  UNIQUE KEY unique_mapping_sync (mapping_id),
  
  -- 索引
  INDEX idx_gitlab_sync_mapping (mapping_id),
  INDEX idx_gitlab_sync_status (sync_status),
  INDEX idx_gitlab_sync_last_sync (last_sync_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GitLab同步状态表';

-- 6. 扩展现有Issue表，添加GitLab相关字段
ALTER TABLE issues 
ADD COLUMN gitlab_issue_id INT NULL COMMENT 'GitLab Issue ID',
ADD COLUMN gitlab_merge_request_id INT NULL COMMENT 'GitLab Merge Request ID',
ADD COLUMN gitlab_commit_sha VARCHAR(40) NULL COMMENT 'GitLab Commit SHA',
ADD COLUMN gitlab_pipeline_id INT NULL COMMENT 'GitLab Pipeline ID',
ADD COLUMN gitlab_url VARCHAR(500) NULL COMMENT 'GitLab相关URL';

-- 为GitLab相关字段添加索引
ALTER TABLE issues 
ADD INDEX idx_issues_gitlab_issue (gitlab_issue_id),
ADD INDEX idx_issues_gitlab_mr (gitlab_merge_request_id),
ADD INDEX idx_issues_gitlab_commit (gitlab_commit_sha),
ADD INDEX idx_issues_gitlab_pipeline (gitlab_pipeline_id);

-- 7. 创建视图：GitLab集成概览
CREATE VIEW gitlab_integration_overview AS
SELECT 
  gi.id as instance_id,
  gi.name as instance_name,
  gi.base_url,
  gi.instance_type,
  gi.is_active as instance_active,
  COUNT(gpm.id) as project_count,
  COUNT(CASE WHEN gpm.is_active = TRUE THEN 1 END) as active_project_count,
  MAX(gss.last_sync_at) as last_sync_time,
  COUNT(CASE WHEN gss.sync_status = 'failed' THEN 1 END) as failed_sync_count
FROM gitlab_instances gi
LEFT JOIN gitlab_project_mappings gpm ON gi.id = gpm.gitlab_instance_id
LEFT JOIN gitlab_sync_status gss ON gpm.id = gss.mapping_id
GROUP BY gi.id, gi.name, gi.base_url, gi.instance_type, gi.is_active;

-- 8. 创建存储过程：清理过期的事件日志
DELIMITER //
CREATE PROCEDURE CleanupGitLabEventLogs(IN days_to_keep INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- 删除指定天数前的已处理事件日志
  DELETE FROM gitlab_event_logs 
  WHERE processed = TRUE 
    AND created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  -- 删除指定天数前的失败事件日志（重试次数超过限制）
  DELETE FROM gitlab_event_logs 
  WHERE processed = FALSE 
    AND retry_count >= 5
    AND created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  COMMIT;
END //
DELIMITER ;

-- 9. 创建触发器：自动创建同步状态记录
DELIMITER //
CREATE TRIGGER tr_gitlab_project_mapping_after_insert
AFTER INSERT ON gitlab_project_mappings
FOR EACH ROW
BEGIN
  INSERT INTO gitlab_sync_status (id, mapping_id, sync_status, created_at)
  VALUES (UUID(), NEW.id, 'in_progress', NOW());
END //
DELIMITER ;

-- 10. 创建触发器：自动删除同步状态记录
DELIMITER //
CREATE TRIGGER tr_gitlab_project_mapping_after_delete
AFTER DELETE ON gitlab_project_mappings
FOR EACH ROW
BEGIN
  DELETE FROM gitlab_sync_status WHERE mapping_id = OLD.id;
END //
DELIMITER ;

-- 11. 插入默认配置（可选）
INSERT INTO gitlab_instances (id, name, base_url, api_token, instance_type, is_active)
VALUES (
  'default-gitlab-instance',
  'Default GitLab Instance',
  'https://gitlab.example.com',
  'encrypted_token_placeholder',
  'self_hosted',
  FALSE
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 12. 创建定时任务事件（需要开启事件调度器）
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT evt_cleanup_gitlab_logs
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
--   CALL CleanupGitLabEventLogs(30);

-- 13. 权限设置（根据实际需要调整）
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gitlab_instances TO 'app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gitlab_project_mappings TO 'app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gitlab_event_logs TO 'app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gitlab_user_mappings TO 'app_user'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gitlab_sync_status TO 'app_user'@'%';
-- GRANT SELECT ON gitlab_integration_overview TO 'app_user'@'%';

-- 14. 性能优化建议
-- 定期分析表统计信息
-- ANALYZE TABLE gitlab_instances;
-- ANALYZE TABLE gitlab_project_mappings;
-- ANALYZE TABLE gitlab_event_logs;
-- ANALYZE TABLE gitlab_user_mappings;
-- ANALYZE TABLE gitlab_sync_status;

-- 15. 备份建议
-- 定期备份GitLab相关表
-- mysqldump --single-transaction --routines --triggers database_name gitlab_instances gitlab_project_mappings gitlab_event_logs gitlab_user_mappings gitlab_sync_status > gitlab_integration_backup.sql
