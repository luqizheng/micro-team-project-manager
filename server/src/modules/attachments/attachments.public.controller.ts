import { Controller, Get, Query, Res } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";
import type { Response } from "express";

// 公共读取接口：用于图片直链访问（302 跳转到带签名的 MinIO/S3 URL）
@Controller("attachments")
export class AttachmentsPublicController {
  constructor(private readonly svc: AttachmentsService) {}

  @Get("public-read")
  async publicRead(@Query("key") key: string) {
    const bucket = process.env.S3_BUCKET || "pm-attachments";
    return this.svc.createPresignedRead({ bucket, key });
  }

  // 直接用于 <img src> 的稳定地址：302 跳转到临时签名 URL
  @Get("public-read-redirect")
  async publicReadRedirect(@Query("key") key: string, @Res() res: Response) {
    const bucket = process.env.S3_BUCKET || "pm-attachments";
    const { url } = await this.svc.createPresignedRead({ bucket, key });
    res.redirect(302, url);
  }
}


