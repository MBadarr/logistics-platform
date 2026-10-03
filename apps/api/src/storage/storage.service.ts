import { ForbiddenException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { requiredEnv } from '../config/environment.js';

export type Upload = { originalname: string; mimetype: string; buffer: Buffer; size: number };

@Injectable()
export class StorageService {
  private readonly bucket = requiredEnv('S3_BUCKET');
  private readonly s3 = new S3Client({
    endpoint: requiredEnv('AWS_ENDPOINT_URL_S3'),
    region: requiredEnv('AWS_REGION'),
    credentials: { accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID'), secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY') },
    forcePathStyle: true,
  });

  async upload(userId: string, file: Upload) {
    const name = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150) || 'file';
    const key = `uploads/${userId}/${randomUUID()}/${name}`;
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype || 'application/octet-stream' }));
    return { key, name, size: file.size };
  }

  async list(userId: string, cursor?: string) {
    const result = await this.s3.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: `uploads/${userId}/`, MaxKeys: 100, ContinuationToken: cursor }));
    return { files: (result.Contents ?? []).map(object => ({ key: object.Key!, name: object.Key!.split('/').at(-1)!, size: object.Size ?? 0 })), cursor: result.NextContinuationToken };
  }

  async download(userId: string, key: string) {
    if (!key.startsWith(`uploads/${userId}/`) || key.includes('..') || key.includes('\\')) throw new ForbiddenException('You cannot access this file');
    const url = await getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key, ResponseContentDisposition: 'attachment' }), { expiresIn: 300 });
    return { url };
  }
}
