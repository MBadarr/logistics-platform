import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StorageService } from './storage.service.js';
import { StorageController } from './storage.controller.js';

@Module({ imports: [AuthModule], providers: [StorageService], controllers: [StorageController] })
export class StorageModule {}
