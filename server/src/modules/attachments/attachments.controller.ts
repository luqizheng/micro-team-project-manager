import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";
import { AuthGuard } from "@nestjs/passport";
import { IsNumber, IsString } from "class-validator";

@UseGuards(AuthGuard("jwt"))
@Controller("attachments")
export class AttachmentsController {
  constructor(private readonly svc: AttachmentsService) {}

  @Post("presign")
  presign(@Body() body: { key: string; contentType: string }) {
    const bucket = process.env.S3_BUCKET || "pm-attachments";
    return this.svc.createPresignedPost({
      bucket,
      key: body.key,
      contentType: body.contentType,
    });
  }

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
}
