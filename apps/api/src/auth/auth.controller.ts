import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthResponseDto } from './auth.dto.js';
import { type AuthenticatedRequest, SessionGuard } from './session.guard.js';

@Controller('auth')
@ApiTags('Authentication')
@ApiBearerAuth('neon')
@UseGuards(SessionGuard)
export class AuthController {
  @Get('me')
  @ApiOperation({ summary: 'Get the Neon-authenticated user' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Neon JWT, or unavailable account' })
  me(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return { user: request.user };
  }
}
