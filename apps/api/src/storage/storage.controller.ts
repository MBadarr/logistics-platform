import { BadRequestException, Controller, Get, Inject, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionGuard, type AuthenticatedRequest } from '../auth/session.guard.js';
import { StorageService, type Upload } from './storage.service.js';

@Controller('storage')
@ApiTags('Files')
@ApiBearerAuth('neon')
@UseGuards(SessionGuard)
export class StorageController {
  constructor(@Inject(StorageService) private readonly storage: StorageService) {}

  @Post('files')
  @ApiOperation({ summary: 'Upload a private file (maximum 10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0 } }))
  upload(@Req() request: AuthenticatedRequest, @UploadedFile() file?: Upload) {
    if (!file) throw new BadRequestException('Choose a file to upload');
    return this.storage.upload(request.user.id, file);
  }

  @Get('files')
  @ApiOperation({ summary: 'List your private files' })
  list(@Req() request: AuthenticatedRequest, @Query('cursor') cursor?: string) {
    if (cursor && cursor.length > 2048) throw new BadRequestException('Invalid cursor');
    return this.storage.list(request.user.id, cursor);
  }

  @Get('download')
  @ApiOperation({ summary: 'Create a five-minute download URL for your file' })
  download(@Req() request: AuthenticatedRequest, @Query('key') key?: string) {
    if (!key || key.length > 1024) throw new BadRequestException('A valid file key is required');
    return this.storage.download(request.user.id, key);
  }
}
