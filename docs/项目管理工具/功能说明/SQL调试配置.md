# SQL调试配置说明

## 概述

配置了TypeORM在调试模式下输出SQL查询语句，方便开发和调试时查看数据库操作。

## 配置内容

### 1. 环境变量配置

在 `.env` 文件中设置：
```env
NODE_ENV=development
```

### 2. TypeORM配置

#### 应用模块配置 (`server/src/modules/app.module.ts`)
```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'mysql',
    url: config.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: false,
    logging: config.get<string>('NODE_ENV') === 'development' ? 
      ['query', 'error', 'warn', 'info', 'log', 'schema'] : false,
    logger: config.get<string>('NODE_ENV') === 'development' ? 
      new CustomTypeOrmLogger() : 'simple-console',
    maxQueryExecutionTime: 1000, // 记录执行时间超过1秒的查询
  }),
}),
```

#### 数据源配置 (`server/src/typeorm-data-source.ts`)
```typescript
export default new DataSource({
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: [ProjectEntity],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? 
    ['query', 'error', 'warn', 'info', 'log', 'schema'] : false,
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000,
});
```

### 3. 自定义日志记录器

创建了 `CustomTypeOrmLogger` 类 (`server/src/common/logger/typeorm-logger.ts`)：

```typescript
export class CustomTypeOrmLogger implements TypeOrmLogger {
  private readonly logger = new Logger('TypeORM');

  logQuery(query: string, parameters?: any[]) {
    this.logger.log(`\n🔍 Query: ${query}`);
    if (parameters && parameters.length > 0) {
      this.logger.log(`📊 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    this.logger.error(`\n❌ Query Error: ${error}`);
    this.logger.error(`🔍 Query: ${query}`);
    if (parameters && parameters.length > 0) {
      this.logger.error(`📊 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    this.logger.warn(`\n⏰ Slow Query (${time}ms): ${query}`);
    if (parameters && parameters.length > 0) {
      this.logger.warn(`📊 Parameters: ${JSON.stringify(parameters)}`);
    }
  }

  // ... 其他日志方法
}
```

## 功能特性

### 1. 日志级别
- **query**: 记录所有SQL查询
- **error**: 记录查询错误
- **warn**: 记录警告信息
- **info**: 记录信息日志
- **log**: 记录一般日志
- **schema**: 记录模式相关日志

### 2. 查询信息
- **SQL语句**: 完整的SQL查询语句
- **参数**: 查询参数值
- **执行时间**: 慢查询警告（超过1秒）
- **错误信息**: 详细的错误描述

### 3. 日志格式
- 使用表情符号区分不同类型的日志
- 清晰的格式和缩进
- 参数以JSON格式显示

## 使用方法

### 1. 启动开发服务器
```bash
cd server
npm run start:dev
```

### 2. 查看SQL输出
在控制台中会看到类似以下的输出：

```
[Nest] 12345  - 2024/01/15, 10:30:45     LOG [TypeORM] 
🔍 Query: SELECT `user`.`id` AS `user_id`, `user`.`name` AS `user_name`, `user`.`email` AS `user_email` FROM `users` `user` WHERE `user`.`status` = ? LIMIT ?
📊 Parameters: ["active",10]

[Nest] 12345  - 2024/01/15, 10:30:45     LOG [TypeORM] 
🔍 Query: SELECT `m`.`id` AS `m_id`, `m`.`projectId` AS `m_projectId`, `m`.`userId` AS `m_userId`, `m`.`role` AS `m_role`, `m`.`joinedAt` AS `m_joinedAt`, `u`.`id` AS `u_id`, `u`.`name` AS `u_name`, `u`.`email` AS `u_email` FROM `memberships` `m` LEFT JOIN `users` `u` ON `u`.`id` = `m`.`userId` WHERE `m`.`projectId` = ? ORDER BY `m`.`joinedAt` DESC LIMIT ?
📊 Parameters: ["project-uuid",50]
```

### 3. 慢查询警告
当查询执行时间超过1秒时，会显示警告：

```
[Nest] 12345  - 2024/01/15, 10:30:45     WARN [TypeORM] 
⏰ Slow Query (1500ms): SELECT * FROM `large_table` WHERE `complex_condition` = ?
📊 Parameters: ["value"]
```

### 4. 错误查询
当查询出错时，会显示详细错误信息：

```
[Nest] 12345  - 2024/01/15, 10:30:45     ERROR [TypeORM] 
❌ Query Error: ER_NO_SUCH_TABLE: Table 'project_manager.nonexistent_table' doesn't exist
🔍 Query: SELECT * FROM `nonexistent_table`
📊 Parameters: []
```

## 配置选项

### 1. 日志级别控制
```typescript
// 只记录查询和错误
logging: ['query', 'error']

// 记录所有日志
logging: ['query', 'error', 'warn', 'info', 'log', 'schema']

// 关闭日志
logging: false
```

### 2. 慢查询阈值
```typescript
// 设置慢查询阈值为2秒
maxQueryExecutionTime: 2000

// 设置慢查询阈值为500毫秒
maxQueryExecutionTime: 500
```

### 3. 日志记录器选择
```typescript
// 使用自定义记录器
logger: new CustomTypeOrmLogger()

// 使用高级控制台记录器
logger: 'advanced-console'

// 使用简单控制台记录器
logger: 'simple-console'
```

## 生产环境配置

### 1. 关闭SQL日志
在生产环境中，应该关闭SQL日志以提高性能：

```typescript
logging: process.env.NODE_ENV === 'development' ? 
  ['query', 'error', 'warn', 'info', 'log', 'schema'] : false,
```

### 2. 只记录错误
如果需要在生产环境中记录数据库错误：

```typescript
logging: process.env.NODE_ENV === 'production' ? 
  ['error'] : ['query', 'error', 'warn', 'info', 'log', 'schema'],
```

## 调试技巧

### 1. 过滤特定查询
可以使用grep命令过滤特定的SQL查询：

```bash
npm run start:dev 2>&1 | grep "SELECT.*users"
```

### 2. 保存日志到文件
将SQL日志保存到文件：

```bash
npm run start:dev > sql-debug.log 2>&1
```

### 3. 实时监控
使用tail命令实时监控日志：

```bash
tail -f sql-debug.log | grep "Query:"
```

## 性能考虑

### 1. 日志开销
- SQL日志会增加一定的性能开销
- 建议只在开发环境启用
- 生产环境应关闭或只记录错误

### 2. 日志大小
- 大量查询会产生大量日志
- 考虑使用日志轮转
- 定期清理旧日志文件

### 3. 敏感信息
- 注意日志中可能包含敏感数据
- 避免在生产环境记录参数
- 考虑数据脱敏

## 故障排除

### 1. 日志不显示
- 检查 `NODE_ENV` 环境变量
- 确认日志级别配置
- 检查控制台输出

### 2. 日志格式异常
- 检查自定义日志记录器实现
- 确认TypeORM版本兼容性
- 查看控制台错误信息

### 3. 性能问题
- 减少日志级别
- 增加慢查询阈值
- 考虑异步日志记录

## 总结

通过配置TypeORM的SQL调试功能，可以：

1. **实时查看SQL查询**：了解数据库操作详情
2. **调试查询问题**：快速定位SQL错误
3. **性能分析**：识别慢查询和性能瓶颈
4. **开发效率**：提高开发和调试效率

记住在生产环境中关闭SQL日志以确保性能和安全性。
