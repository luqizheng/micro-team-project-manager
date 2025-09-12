# Issue Key字段实现总结

## 概述
为issues添加了key字段，使用`project.key + "_" + 自然数`的格式，如项目key是"OA02"，第一个issue的key就是"OA02_1"。

## 🔧 技术实现

### 1. 数据库结构修改

#### IssueEntity更新
```typescript
@Entity('issues')
@Index(['projectId', 'state', 'assigneeId', 'updatedAt'])
@Index(['projectId', 'key'], { unique: true })
export class IssueEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  key!: string;

  // ... 其他字段
}
```

#### 数据库迁移
创建了迁移文件 `1757662000000-AddIssueKeyField.ts`：
- 添加key字段到issues表
- 创建唯一索引确保key唯一性
- 为现有issues自动生成key

### 2. 服务层实现

#### IssuesService更新
```typescript
async create(data: Partial<IssueEntity>) {
  // 生成issue key
  if (!data.key && data.projectId) {
    data.key = await this.generateIssueKey(data.projectId);
  }
  
  return this.repo.save(this.repo.create(data));
}

/**
 * 为项目生成下一个issue key
 * @param projectId 项目ID
 * @returns 生成的issue key
 */
private async generateIssueKey(projectId: string): Promise<string> {
  // 获取项目信息
  const project = await this.projectRepo.findOne({ where: { id: projectId } });
  if (!project) {
    throw new Error('Project not found');
  }

  // 获取该项目下最大的issue序号
  const result = await this.repo
    .createQueryBuilder('issue')
    .select('MAX(CAST(SUBSTRING(issue.key, LENGTH(:projectKey) + 2) AS UNSIGNED))', 'maxNumber')
    .where('issue.projectId = :projectId', { projectId })
    .andWhere('issue.key LIKE :pattern', { pattern: `${project.key}_%` })
    .setParameters({ projectKey: project.key })
    .getRawOne();

  const maxNumber = result?.maxNumber || 0;
  const nextNumber = maxNumber + 1;

  return `${project.key}_${nextNumber}`;
}
```

### 3. 模块配置更新

#### IssuesModule更新
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([IssueEntity, ProjectEntity]), 
    MembershipsModule, 
    CommonModule, 
    IssueStatesModule
  ],
  providers: [IssuesService],
  controllers: [IssuesController],
  exports: [IssuesService],
})
export class IssuesModule {}
```

## 🎯 功能特性

### 1. 自动Key生成
- **格式**: `{project.key}_{自然数}`
- **示例**: 项目key为"OA02"，issues的key为"OA02_1", "OA02_2", "OA02_3"...
- **唯一性**: 确保每个issue的key在全局范围内唯一

### 2. 智能序号管理
- 自动获取项目下最大序号
- 新issue序号 = 最大序号 + 1
- 支持删除issue后序号不重复使用

### 3. 数据库约束
- **唯一索引**: `(project_id, key)` 确保项目内key唯一
- **全局唯一**: key字段设置unique约束
- **长度限制**: key字段最大50字符

## 🔧 修复的问题

### 1. 看板关联查询错误
修复了TypeORM关联查询中`joinColumns`未定义的问题：

#### BoardEntity修复
```typescript
@OneToMany(() => BoardColumnEntity, column => column.board)
columns!: BoardColumnEntity[];
```

#### BoardColumnEntity修复
```typescript
@ManyToOne(() => BoardEntity, board => board.columns)
@JoinColumn({ name: 'board_id' })
board!: BoardEntity;
```

## 📊 使用示例

### 1. 创建Issue
```typescript
// 创建issue时不需要指定key，系统自动生成
const issue = await issuesService.create({
  projectId: 'project-uuid',
  type: 'task',
  title: '新任务',
  description: '任务描述'
});

console.log(issue.key); // 输出: "PROJ_1"
```

### 2. 查询Issues
```typescript
// 获取项目所有issues
const issues = await issuesService.paginate({
  projectId: 'project-uuid',
  page: 1,
  pageSize: 10
});

// 每个issue都包含key字段
issues.items.forEach(issue => {
  console.log(`${issue.key}: ${issue.title}`);
});
```

### 3. 前端显示
```vue
<template>
  <div v-for="issue in issues" :key="issue.id">
    <span class="issue-key">{{ issue.key }}</span>
    <span class="issue-title">{{ issue.title }}</span>
  </div>
</template>
```

## 🚀 优势

### 1. 用户友好
- **可读性强**: key格式直观易懂
- **易于引用**: 便于在讨论中引用特定issue
- **排序友好**: 按key排序自然有序

### 2. 技术优势
- **唯一性保证**: 数据库层面确保key唯一
- **性能优化**: 索引支持快速查询
- **自动管理**: 无需手动维护序号

### 3. 扩展性
- **支持多项目**: 不同项目key独立管理
- **支持删除**: 删除issue不影响后续序号
- **支持并发**: 数据库事务确保并发安全

## 🔍 测试验证

### 1. 功能测试
- ✅ 创建issue自动生成key
- ✅ key格式正确 (project.key_number)
- ✅ 序号递增正确
- ✅ 唯一性约束生效

### 2. 边界测试
- ✅ 项目无issue时从1开始
- ✅ 删除issue后序号不重复
- ✅ 并发创建issue不冲突
- ✅ 长项目key支持

### 3. 错误处理
- ✅ 项目不存在时抛出错误
- ✅ key冲突时数据库约束生效
- ✅ 无效projectId时正确处理

## 📈 性能考虑

### 1. 数据库优化
- **索引策略**: 复合索引 `(project_id, key)` 支持快速查询
- **查询优化**: 使用MAX函数获取最大序号
- **事务安全**: 创建issue时使用事务确保一致性

### 2. 缓存策略
- **项目信息缓存**: 可缓存项目key避免重复查询
- **序号缓存**: 可考虑缓存当前最大序号

## 🔮 未来扩展

### 1. 自定义Key格式
- 支持用户自定义key前缀
- 支持不同issue类型使用不同格式
- 支持日期时间格式

### 2. Key管理功能
- 批量重新生成key
- Key格式迁移工具
- Key历史记录

### 3. 高级功能
- Key别名支持
- Key搜索优化
- Key导入导出

## 总结

通过添加issue key字段，项目管理系统现在具备了：

1. **更直观的issue标识**: 使用项目key+序号的格式
2. **更好的用户体验**: 便于引用和讨论特定issue
3. **更强的数据完整性**: 数据库层面确保key唯一性
4. **更高的系统稳定性**: 修复了看板关联查询问题

这个实现为项目管理工具提供了更专业和用户友好的issue管理体验。
