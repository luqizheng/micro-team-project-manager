# 加密工具类重构总结

## 任务概述

本次重构的目标是统一管理项目中的加密解密功能，将分散在各个服务中的加密解密方法整合到一个统一的工具类中。

## 完成的工作

### 1. 创建EncryptHelper工具类

**文件位置**: `server/src/common/utils/encrypt-helper.ts`

**功能特性**:
- 密码哈希功能：使用SHA256算法对用户密码进行哈希处理
- API Token加密解密：使用AES-ECB模式对GitLab API Token进行加密解密
- 提供便捷方法：支持直接使用ConfigService进行加密解密操作
- 错误处理：解密失败时返回原始值，确保向后兼容

**主要方法**:
- `hashPassword(password: string): string` - 哈希密码
- `verifyPassword(password: string, hashedPassword: string): boolean` - 验证密码
- `encryptApiToken(token: string, secret: string): string` - 加密API Token
- `decryptApiToken(encryptedToken: string, secret: string): string` - 解密API Token
- `encryptApiTokenWithConfig(token: string, configService: ConfigService): string` - 使用ConfigService加密
- `decryptApiTokenWithConfig(encryptedToken: string, configService: ConfigService): string` - 使用ConfigService解密

### 2. 替换用户密码相关方法

**涉及文件**:
- `server/src/modules/auth/auth.service.ts`
- `server/src/modules/users/users.service.ts`
- `server/src/modules/demo-data/demo-data.service.ts`
- `server/src/app.initializer.ts`
- `server/src/modules/gitlab-integration/services/gitlab-user-sync.service.ts`

**替换内容**:
- 删除各服务中的私有`hash`方法
- 将`this.hash(password)`替换为`EncryptHelper.hashPassword(password)`
- 将密码验证逻辑替换为`EncryptHelper.verifyPassword(password, hashedPassword)`

### 3. 替换GitLab API Token相关方法

**涉及文件**:
- `server/src/modules/gitlab-integration/services/gitlab-integration.service.ts`
- `server/src/modules/gitlab-integration/services/gitlab-api-gitbeaker.service.ts`

**替换内容**:
- 删除各服务中的私有`encryptApiToken`和`decryptApiToken`方法
- 将加密调用替换为`EncryptHelper.encryptApiTokenWithConfig(token, configService)`
- 将解密调用替换为`EncryptHelper.decryptApiTokenWithConfig(encryptedToken, configService)`

### 4. 清理多余代码

**清理内容**:
- 删除各服务中重复的加密解密方法
- 清理不再需要的导入（如`createHash`、`CryptoJS`等）
- 保持代码整洁，避免重复代码

### 5. 测试验证

**测试文件**: `server/src/common/utils/encrypt-helper.spec.ts`

**测试覆盖**:
- 密码哈希功能测试（8个测试用例）
- API Token加密解密功能测试（8个测试用例）
- 错误处理测试
- 向后兼容性测试

**测试结果**: ✅ 所有测试通过

## 技术实现细节

### 密码哈希
- 使用Node.js内置的`crypto`模块
- 采用SHA256算法
- 确保相同密码产生相同哈希，不同密码产生不同哈希

### API Token加密
- 使用`crypto-js`库
- 采用AES-ECB模式
- 密钥长度固定为32字节（通过padding处理）
- 支持解密失败时的向后兼容处理

### 错误处理
- 解密失败时记录错误日志
- 返回原始值确保向后兼容
- 空结果检测防止静默失败

## 优势

1. **代码复用**: 消除了重复的加密解密代码
2. **统一管理**: 所有加密解密逻辑集中在一个工具类中
3. **易于维护**: 修改加密算法只需要修改一个文件
4. **类型安全**: 使用TypeScript提供类型检查
5. **测试覆盖**: 完整的单元测试确保功能正确性
6. **向后兼容**: 解密失败时返回原始值，不影响现有数据

## 文件结构

```
server/src/common/utils/
├── encrypt-helper.ts          # 加密工具类
├── encrypt-helper.spec.ts     # 单元测试
└── index.ts                   # 导出文件
```

## 使用示例

```typescript
import { EncryptHelper } from '../../common/utils';

// 密码哈希
const hashedPassword = EncryptHelper.hashPassword('user123');
const isValid = EncryptHelper.verifyPassword('user123', hashedPassword);

// API Token加密解密
const encryptedToken = EncryptHelper.encryptApiTokenWithConfig(token, configService);
const decryptedToken = EncryptHelper.decryptApiTokenWithConfig(encryptedToken, configService);
```

## 注意事项

1. 确保所有使用加密解密功能的地方都已更新为使用EncryptHelper
2. 在生产环境中确保JWT_SECRET配置正确
3. 定期备份加密数据，以防密钥丢失
4. 考虑在未来版本中升级到更安全的加密算法（如bcrypt用于密码哈希）

## 完成状态

✅ 所有任务已完成
- 创建EncryptHelper工具类
- 替换user.passwordHash相关方法
- 替换gitlabInstance.apiToken相关方法
- 删除多余的加密解密方法
- 测试验证功能正常
- 代码编译通过
- 单元测试全部通过
