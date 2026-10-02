import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MailModule } from '../mail/mail.module.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { AuthRequestGuard } from './auth-request.guard.js';
import { SessionGuard } from './session.guard.js';

@Module({
  imports: [DatabaseModule, MailModule],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, AuthRequestGuard, SessionGuard],
  exports: [AuthService, SessionGuard],
})
export class AuthModule {}
