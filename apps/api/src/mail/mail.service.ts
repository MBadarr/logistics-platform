import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { requiredEnv } from '../config/environment.js';

@Injectable()
export class MailService {
  private client?: Resend;

  async sendPasswordReset(email: string, resetUrl: string) {
    // Lazy initialization allows startup before credentials are inserted.
    const from = requiredEnv('RESEND_FROM');
    this.client ??= new Resend(requiredEnv('RESEND_API_KEY'));
    const { data, error } = await this.client.emails.send({
      from,
      to: email,
      subject: 'Reset your logistics account password',
      text: `A password reset was requested for your account.\n\nOpen this link within 30 minutes:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    });
    // Propagate returned API errors so the reset flow removes the issued token.
    if (error || !data?.id) throw new Error('Resend email delivery failed');
  }
}
