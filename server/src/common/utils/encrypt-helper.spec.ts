import { EncryptHelper } from './encrypt-helper';
import { ConfigService } from '@nestjs/config';

describe('EncryptHelper', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('test-secret-key')
    } as any;
  });

  describe('密码哈希功能', () => {
    it('应该能够哈希密码', () => {
      const password = 'test123456';
      const hashed = EncryptHelper.hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toHaveLength(64); // SHA256哈希长度
    });

    it('相同密码应该产生相同哈希', () => {
      const password = 'test123456';
      const hashed1 = EncryptHelper.hashPassword(password);
      const hashed2 = EncryptHelper.hashPassword(password);
      
      expect(hashed1).toBe(hashed2);
    });

    it('不同密码应该产生不同哈希', () => {
      const password1 = 'test123456';
      const password2 = 'test654321';
      const hashed1 = EncryptHelper.hashPassword(password1);
      const hashed2 = EncryptHelper.hashPassword(password2);
      
      expect(hashed1).not.toBe(hashed2);
    });

    it('应该能够验证密码', () => {
      const password = 'test123456';
      const hashed = EncryptHelper.hashPassword(password);
      
      expect(EncryptHelper.verifyPassword(password, hashed)).toBe(true);
      expect(EncryptHelper.verifyPassword('wrong-password', hashed)).toBe(false);
    });
  });

  describe('API Token加密功能', () => {
    it('应该能够加密和解密API Token', () => {
      const token = 'test-api-token-12345';
      const secret = 'test-secret-key';
      
      const encrypted = EncryptHelper.encryptApiToken(token, secret);
      const decrypted = EncryptHelper.decryptApiToken(encrypted, secret);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(token);
      expect(decrypted).toBe(token);
    });

    it('使用ConfigService应该能够加密和解密API Token', () => {
      const token = 'test-api-token-12345';
      
      const encrypted = EncryptHelper.encryptApiTokenWithConfig(token, configService);
      const decrypted = EncryptHelper.decryptApiTokenWithConfig(encrypted, configService);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(token);
      expect(decrypted).toBe(token);
    });

    it('解密失败时应该返回原始值', () => {
      const invalidEncryptedToken = 'invalid-encrypted-token';
      const secret = 'test-secret-key';
      
      const result = EncryptHelper.decryptApiToken(invalidEncryptedToken, secret);
      
      expect(result).toBe(invalidEncryptedToken);
    });

    it('不同密钥应该产生不同加密结果', () => {
      const token = 'test-api-token-12345';
      const secret1 = 'secret-key-1';
      const secret2 = 'secret-key-2';
      
      const encrypted1 = EncryptHelper.encryptApiToken(token, secret1);
      const encrypted2 = EncryptHelper.encryptApiToken(token, secret2);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
