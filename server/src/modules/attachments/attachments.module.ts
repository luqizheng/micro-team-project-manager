import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsPublicController } from './attachments.public.controller';
import { AttachmentEntity } from './attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity]), MulterModule.register({ storage: memoryStorage() })],
  providers: [AttachmentsService],
  controllers: [AttachmentsController, AttachmentsPublicController],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}


