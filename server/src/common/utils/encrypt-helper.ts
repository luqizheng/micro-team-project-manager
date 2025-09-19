import { createHash } from 'crypto';
import * as CryptoJS from 'crypto-js';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

/**
 * 加密工具�?
 * 统一管理密码哈希和API Token的加密解�?
 */
export class EncryptHelper {
  private static readonly logger = new Logger(EncryptHelper.name);

  /**
   * 哈希密码
   * 使用SHA256算法对密码进行哈希处�?
   * @param password 原始密码
   * @returns 哈希后的密码
   */
  static hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * 验证密码
   * 验证输入的密码是否与存储的哈希值匹�?
   * @param password 原始密码
   * @param hashedPassword 存储的哈希密�?
   * @returns 是否匹配
   */
  static verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword;
  }

  /**
   * 加密API Token
   * 使用AES-ECB模式加密API Token
   * @param token 原始API Token
   * @param secret JWT密钥
   * @returns 加密后的Token
   */
  static encryptApiToken(token: string, secret: string): string {
    const key = CryptoJS.enc.Utf8.parse(
      secret.padEnd(32, "0").substring(0, 32)
    ); // 确保密钥长度�?2字节
    const encrypted = CryptoJS.AES.encrypt(token, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  }

  /**
   * 解密API Token
   * 使用AES-ECB模式解密API Token
   * @param encryptedToken 加密的API Token
   * @param secret JWT密钥
   * @returns 解密后的Token，如果解密失败返回原始�?
   */
  static decryptApiToken(encryptedToken: string, secret: string): string {
    try {
      const key = CryptoJS.enc.Utf8.parse(
        secret.padEnd(32, "0").substring(0, 32)
      ); // 确保密钥长度�?2字节
      const decrypted = CryptoJS.AES.decrypt(encryptedToken, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      });
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      // 如果解密结果为空，说明解密失�?
      if (!result) {
        throw new Error('解密结果为空');
      }
      return result;
    } catch (error: any) {
      this.logger.error("API Token解密失败", { error: error.message });
      // 如果解密失败，可能是旧格式的哈希，返回原始�?
      return encryptedToken;
    }
  }

  /**
   * 使用ConfigService加密API Token
   * 便捷方法，自动从ConfigService获取JWT密钥
   * @param token 原始API Token
   * @param configService ConfigService实例
   * @returns 加密后的Token
   */
  static encryptApiTokenWithConfig(token: string, configService: ConfigService): string {
    const secret = configService.get<string>("JWT_SECRET") || "default-secret";
    return this.encryptApiToken(token, secret);
  }

  /**
   * 使用ConfigService解密API Token
   * 便捷方法，自动从ConfigService获取JWT密钥
   * @param encryptedToken 加密的API Token
   * @param configService ConfigService实例
   * @returns 解密后的Token
   */
  static decryptApiTokenWithConfig(encryptedToken: string, configService: ConfigService): string {
    const secret = configService.get<string>("JWT_SECRET") || "default-secret";
    return this.decryptApiToken(encryptedToken, secret);
  }
}
