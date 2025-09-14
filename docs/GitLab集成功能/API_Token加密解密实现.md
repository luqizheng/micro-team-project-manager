# API Token 加密解密实现

## 概述

为了安全地存储和传输 GitLab API Token，我们实现了可逆的 AES 加密/解密机制。

## 实现方案

### 1. 加密算法
- **算法**: AES-256-ECB
- **密钥**: 基于 JWT_SECRET 环境变量生成
- **填充**: PKCS7

### 2. 密钥生成
```typescript
const secret = this.configService.get<string>("JWT_SECRET") || "default-secret";
const key = CryptoJS.enc.Utf8.parse(secret.padEnd(32, '0').substring(0, 32));
```

### 3. 加密方法
```typescript
private encryptApiToken(token: string): string {
  const secret = this.configService.get<string>("JWT_SECRET") || "default-secret";
  const key = CryptoJS.enc.Utf8.parse(secret.padEnd(32, '0').substring(0, 32));
  const encrypted = CryptoJS.AES.encrypt(token, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}
```

### 4. 解密方法
```typescript
private decryptApiToken(encryptedToken: string): string {
  try {
    const secret = this.configService.get<string>("JWT_SECRET") || "default-secret";
    const key = CryptoJS.enc.Utf8.parse(secret.padEnd(32, '0').substring(0, 32));
    const decrypted = CryptoJS.AES.decrypt(encryptedToken, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error: any) {
    this.logger.error('API Token解密失败', { error: error.message });
    return encryptedToken; // 降级处理
  }
}
```

## 文件更新

### 1. gitlab-integration.service.ts
- 更新了 `encryptApiToken` 方法使用 AES 加密
- 新增了 `decryptApiToken` 方法

### 2. gitlab-api-gitbeaker.service.ts
- 新增了 `decryptApiToken` 方法
- 新增了 `getDecryptedApiToken` 方法用于智能识别 token 格式
- 更新了 `createGitLabClient` 方法使用解密后的 token

## Token 格式识别

### 1. AES 加密格式
- 包含特殊字符：`=`, `+`, `/`
- 可以正常解密

### 2. 旧格式 SHA256 哈希
- 64位十六进制字符串
- 无法解密，需要重新配置

### 3. 明文格式
- 不包含特殊字符且不是64位十六进制
- 直接使用

## 使用方式

### 在 GitLab 实例创建时
```typescript
// 自动加密存储
const encryptedToken = this.encryptApiToken(dto.accessToken);
```

### 在 API 调用时
```typescript
// 自动解密使用
const decryptedToken = this.getDecryptedApiToken(instance);
```

## 安全考虑

1. **密钥管理**: 使用 JWT_SECRET 环境变量作为加密密钥
2. **错误处理**: 解密失败时记录错误日志
3. **向后兼容**: 支持旧格式 token 的识别和提示
4. **降级处理**: 解密失败时返回原始值，避免服务中断

## 迁移建议

1. **现有实例**: 需要重新配置 GitLab 实例以使用新的加密格式
2. **环境变量**: 确保 JWT_SECRET 环境变量已正确设置
3. **监控**: 监控解密失败的日志，及时处理问题

## 依赖包

```json
{
  "crypto-js": "^4.2.0",
  "@types/crypto-js": "^4.2.2"
}
```

## 总结

通过实现 AES 加密/解密机制，我们确保了 GitLab API Token 的安全存储和传输，同时保持了系统的向后兼容性和错误处理能力。
