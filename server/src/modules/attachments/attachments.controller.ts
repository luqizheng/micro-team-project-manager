import { Body, Controller, Get, Param, Post, Query, UseGuards, UploadedFile, UseInterceptors } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";
import { AuthGuard } from "@nestjs/passport";
import { IsNumber, IsString } from "class-validator";
import { FileInterceptor } from "@nestjs/platform-express";

@UseGuards(AuthGuard("jwt"))
@Controller("attachments")
export class AttachmentsController {
  constructor(private readonly svc: AttachmentsService) {}

  // @Post("presign")
  // presign(@Body() body: { key: string; contentType: string }) {
  //   const bucket = process.env.S3_BUCKET || "pm-attachments";
  //   return this.svc.createPresignedPost({
  //     bucket,
  //     key: body.key,
  //     contentType: body.contentType,
  //   });
  // }

  @Get("issues/:issueId")
  list(@Param("issueId") issueId: string) {
    return this.svc.listByIssue(issueId);
  }

  @Post("issues/:issueId/record")
  record(
    @Param("issueId") issueId: string,
    @Body()
    body: {
      objectKey: string;
      fileName: string;
      size: number;
      contentType: string;
    }
  ) {
    return this.svc.createRecord({ issueId, ...body });
  }

  // @Get("presign-read")
  // presignRead(@Query("key") key: string) {
  //   const bucket = process.env.S3_BUCKET || "pm-attachments";
  //   return this.svc.createPresignedRead({ bucket, key });
  // }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: any,
    @Body() body: { projectId: string; issueId: string; fileName?: string }
  ) {
    if (!file || !body?.projectId || !body?.issueId) {
      throw new Error("缺少文件或关联ID");
    }
    const bucket = process.env.S3_BUCKET || "pm-attachments";
    const originalName = body.fileName || file.originalname || "file";
    const objectKey = `${body.projectId}/${body.issueId}/${Date.now()}-${encodeURIComponent(originalName)}`;
    await this.svc.uploadBuffer({
      bucket,
      key: objectKey,
      contentType: file.mimetype || "application/octet-stream",
      body: file.buffer,
    });

    // 记录
    await this.svc.createRecord({
      issueId: body.issueId,
      objectKey,
      fileName: originalName,
      size: file.size,
      contentType: file.mimetype || "application/octet-stream",
    });

    const url = `/api/v1/attachments/public-read-redirect?key=${encodeURIComponent(objectKey)}`;
    return { key: objectKey, url };
  }
}
