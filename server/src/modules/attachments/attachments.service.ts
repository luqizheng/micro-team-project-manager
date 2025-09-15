import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AttachmentEntity } from './attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(@InjectRepository(AttachmentEntity) private readonly repo: Repository<AttachmentEntity>) {}
  private s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
  });

  async createPresignedPost(params: { bucket: string; key: string; contentType: string; expiresIn?: number }) {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: params.expiresIn || 300 });
    return { url, method: 'PUT', headers: { 'Content-Type': params.contentType } };
  }

  async createPresignedRead(params: { bucket: string; key: string; expiresIn?: number }) {
    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: params.expiresIn || 3600 });
    return { url, method: 'GET' };
  }

  async uploadBuffer(params: { bucket: string; key: string; contentType: string; body: Buffer }) {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    });
    await this.s3.send(command);
    return { key: params.key };
  }

  listByIssue(issueId: string) {
    return this.repo.find({ where: { issueId }, order: { createdAt: 'DESC' } });
  }

  createRecord(data: { issueId: string; objectKey: string; fileName: string; size: number; contentType: string }) {
    return this.repo.save(this.repo.create(data));
  }
}


