import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ejs from 'ejs';
import { existsSync } from 'fs';
import * as path from 'path';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

interface Sender {
  name?: string;
  email: string;
}

interface SendOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

/**
 * Transactional email via Brevo's HTTP API.
 *
 * The HTTP API is used rather than SMTP so delivery does not depend on
 * outbound SMTP ports, which are commonly blocked by hosting providers.
 * Bodies are still rendered from the EJS templates in ./templates.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string {
    const key = this.configService.get<string>('BREVO_API_KEY')?.trim();

    if (!key || key.startsWith('your_')) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Set BREVO_API_KEY in config/dev.env.',
      );
    }

    return key;
  }

  /**
   * Brevo needs the sender split into name and address. `EMAIL_FROM` accepts
   * either `Name <address@example.com>` or a bare address.
   */
  private getSender(): Sender {
    const explicitEmail = this.configService
      .get<string>('BREVO_SENDER_EMAIL')
      ?.trim();

    if (explicitEmail) {
      return {
        email: explicitEmail,
        name: this.configService.get<string>('BREVO_SENDER_NAME')?.trim(),
      };
    }

    const raw = (this.configService.get<string>('EMAIL_FROM') ?? '')
      .replace(/^["']|["']$/g, '')
      .trim();

    const match = raw.match(/^(.*)<\s*([^>]+)\s*>$/);
    if (match) {
      return { name: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2].trim() };
    }

    if (!raw) {
      throw new ServiceUnavailableException(
        'No email sender configured. Set BREVO_SENDER_EMAIL or EMAIL_FROM in config/dev.env.',
      );
    }

    return { email: raw };
  }

  /**
   * Templates sit beside the compiled output in dist, but fall back to the
   * source tree when running from ts-node (seeding, scripts).
   */
  private resolveTemplate(name: string): string {
    const compiled = path.join(__dirname, 'templates', name);
    if (existsSync(compiled)) return compiled;

    return path.join(process.cwd(), 'src', 'common', 'email', 'templates', name);
  }

  private async send({ to, subject, template, data }: SendOptions): Promise<void> {
    const htmlContent = await ejs.renderFile(this.resolveTemplate(template), data);

    const response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': this.getApiKey(),
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: this.getSender(),
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      // Brevo returns { code, message } on failure; log it, but do not leak
      // provider internals to the caller.
      const detail = await response.text();
      this.logger.error(`Brevo rejected the message (${response.status}): ${detail}`);
      throw new ServiceUnavailableException(
        'The email could not be sent. Please try again shortly.',
      );
    }

    const { messageId } = (await response.json()) as { messageId?: string };
    this.logger.log(`Sent "${subject}" to ${to} (messageId: ${messageId ?? 'n/a'})`);
  }

  async sendConfirmationEmail(to: string, name: string, otp: string): Promise<void> {
    try {
      await this.send({
        to,
        subject: 'Verify your email address',
        template: 'confirm-email.ejs',
        data: { name, otp },
      });
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendForgotPasswordEmail(to: string, name: string, otp: string): Promise<void> {
    try {
      await this.send({
        to,
        subject: 'Reset your password',
        template: 'forgot-password.ejs',
        data: { name, otp },
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendOrderConfirmationEmail(to: string, name: string, order: any): Promise<void> {
    try {
      await this.send({
        to,
        subject: `Order Confirmed - #${order.orderCode}`,
        template: 'order-confirmation.ejs',
        data: { name, order },
      });
    } catch (error) {
      this.logger.error(`Failed to send order confirmation to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendOrderCancellationEmail(
    to: string,
    name: string,
    order: any,
    reason?: string,
  ): Promise<void> {
    try {
      await this.send({
        to,
        subject: `Order Cancelled - #${order.orderCode}`,
        template: 'order-cancellation.ejs',
        data: { name, order, reason },
      });
    } catch (error) {
      this.logger.error(`Failed to send cancellation email to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendOrderStatusUpdateEmail(
    to: string,
    name: string,
    order: any,
    status: string,
  ): Promise<void> {
    try {
      await this.send({
        to,
        subject: `Update on Order #${order.orderCode}: ${status}`,
        template: 'order-status.ejs',
        data: { name, order, status },
      });
    } catch (error) {
      this.logger.error(`Failed to send status update to ${to}: ${(error as Error).message}`);
      throw error;
    }
  }
}
