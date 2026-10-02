import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import {
  SignupDto,
  LoginDto,
  EmailDto,
  ResetPasswordDto,
  AuthResponseDto,
  MessageResponseDto,
} from './auth.dto.js';
import { AuthService, SESSION_SECONDS } from './auth.service.js';
import { AuthRequestGuard } from './auth-request.guard.js';
import {
  type AuthenticatedRequest,
  SESSION_COOKIE,
  SessionGuard,
  sessionToken,
} from './session.guard.js';
import {
  emailInput,
  passwordInput,
  resetInput,
  signupInput,
} from './auth.validation.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

@Controller('auth')
@ApiTags('Authentication')
@ApiForbiddenResponse({ description: 'Request origin is not allowed' })
@ApiResponse({
  status: 429,
  description: 'Too many attempts; retry after a minute',
})
@UseGuards(AuthRequestGuard)
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Create an account and sign in',
    description: 'Sets a seven-day HttpOnly logistics_session cookie.',
  })
  @ApiBody({ type: SignupDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid name, email, or password' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async signup(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.signup(signupInput(body));
    response.cookie(SESSION_COOKIE, result.token, {
      ...cookieOptions(),
      maxAge: SESSION_SECONDS * 1000,
    });
    response.setHeader('Cache-Control', 'no-store');
    return { user: result.user };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Sign in',
    description: 'Sets a seven-day HttpOnly logistics_session cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Email or password is incorrect' })
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(
      emailInput(body),
      passwordInput(body, false),
    );
    response.cookie(SESSION_COOKIE, result.token, {
      ...cookieOptions(),
      maxAge: SESSION_SECONDS * 1000,
    });
    response.setHeader('Cache-Control', 'no-store');
    return { user: result.user };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the signed-in user' })
  @ApiCookieAuth('session')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired, or revoked session',
  })
  @UseGuards(SessionGuard)
  me(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    return { user: request.user };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Sign out',
    description:
      'Revokes the current session and clears its cookie. Also succeeds without a session.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(sessionToken(request));
    response.clearCookie(SESSION_COOKIE, cookieOptions());
    return { message: 'Signed out' };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request a password reset email',
    description:
      'Returns the same message whether the account exists or not. Reset links expire after 30 minutes.',
  })
  @ApiBody({ type: EmailDto })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid email address' })
  @HttpCode(200)
  forgotPassword(@Body() body: unknown) {
    return this.auth.forgotPassword(emailInput(body));
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset the password',
    description:
      'Consumes the email token and revokes all sessions. Sign in again afterward.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid password or invalid, expired, or used token',
  })
  @HttpCode(200)
  async resetPassword(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const input = resetInput(body);
    const result = await this.auth.resetPassword(input.token, input.password);
    response.clearCookie(SESSION_COOKIE, cookieOptions());
    return result;
  }
}
