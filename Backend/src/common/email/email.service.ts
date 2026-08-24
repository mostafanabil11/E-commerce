import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
        pass: this.configService.getOrThrow<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private getFromHeader(): string {
    const rawFrom = this.configService.getOrThrow<string>('EMAIL_FROM');
    return rawFrom.replace(/^["']|["']$/g, '').trim();
  }

  async sendConfirmationEmail(
    to: string,
    name: string,
    otp: string,
  ): Promise<void> {
    try {
      let templatePath = path.join(__dirname, 'templates', 'confirm-email.ejs');
      if (!require('fs').existsSync(templatePath)) {
        templatePath = path.join(
          process.cwd(),
          'src',
          'common',
          'email',
          'templates',
          'confirm-email.ejs',
        );
      }

      const html = await ejs.renderFile(templatePath, { name, otp });

      const info = await this.transporter.sendMail({
        from: this.getFromHeader(),
        to,
        subject: 'Verify your email address',
        html,
      });

      this.logger.log(
        `Confirmation email sent successfully to ${to} (MessageId: ${info.messageId})`,
      );
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to ${to}:`, error);
      throw error;
    }
  }

  async sendForgotPasswordEmail(
    to: string,
    name: string,
    otp: string,
  ): Promise<void> {
    try {
      let templatePath = path.join(__dirname, 'templates', 'forgot-password.ejs');
      if (!require('fs').existsSync(templatePath)) {
        templatePath = path.join(
          process.cwd(),
          'src',
          'common',
          'email',
          'templates',
          'forgot-password.ejs',
        );
      }

      const html = await ejs.renderFile(templatePath, { name, otp });

      const info = await this.transporter.sendMail({
        from: this.getFromHeader(),
        to,
        subject: 'Reset your password',
        html,
      });

      this.logger.log(
        `Forgot password email sent successfully to ${to} (MessageId: ${info.messageId})`,
      );
    } catch (error) {
      this.logger.error(`Failed to send forgot password email to ${to}:`, error);
      throw error;
    }
  }

  async sendOrderConfirmationEmail(to: string, name: string, order: any): Promise<void> {
    try {
      let templatePath = path.join(__dirname, 'templates', 'order-confirmation.ejs');
      if (!require('fs').existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), 'src', 'common', 'email', 'templates', 'order-confirmation.ejs');
      }

      const html = await ejs.renderFile(templatePath, { name, order });
      const text = `Hi ${name},\n\nWe've received your order #${order.orderCode}! Total: ${order.totalPrice} EGP. We are processing it for shipment.\n\nThank you for shopping with us!`;

      const fromHeader = this.getFromHeader();
      const info = await this.transporter.sendMail({
        from: fromHeader,
        replyTo: fromHeader,
        to,
        subject: `Order Confirmed - #${order.orderCode}`,
        text,
        html,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'ECommerceEngine/1.0',
        },
      });

      this.logger.log(`Order confirmation email sent to ${to} (MessageId: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email to ${to}:`, error);
    }
  }

  async sendOrderCancellationEmail(to: string, name: string, order: any, reason?: string): Promise<void> {
    try {
      let templatePath = path.join(__dirname, 'templates', 'order-cancellation.ejs');
      if (!require('fs').existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), 'src', 'common', 'email', 'templates', 'order-cancellation.ejs');
      }

      const html = await ejs.renderFile(templatePath, { name, order, reason });
      const text = `Hi ${name},\n\nYour order #${order.orderCode} has been cancelled. Reason: ${reason || 'N/A'}.\n\nIf you have any questions, please contact our support.`;

      const fromHeader = this.getFromHeader();
      const info = await this.transporter.sendMail({
        from: fromHeader,
        replyTo: fromHeader,
        to,
        subject: `Order Cancelled - #${order.orderCode}`,
        text,
        html,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'ECommerceEngine/1.0',
        },
      });

      this.logger.log(`Order cancellation email sent to ${to} (MessageId: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`Failed to send order cancellation email to ${to}:`, error);
    }
  }

  async sendOrderStatusUpdateEmail(to: string, name: string, order: any, status: string): Promise<void> {
    try {
      let templatePath = path.join(__dirname, 'templates', 'order-status.ejs');
      if (!require('fs').existsSync(templatePath)) {
        templatePath = path.join(process.cwd(), 'src', 'common', 'email', 'templates', 'order-status.ejs');
      }

      const html = await ejs.renderFile(templatePath, { name, order, status });
      const text = `Hi ${name},\n\nThe status of your order #${order.orderCode} has been updated to: ${status}.\n\nThank you for shopping with us!`;

      const fromHeader = this.getFromHeader();
      const info = await this.transporter.sendMail({
        from: fromHeader,
        replyTo: fromHeader,
        to,
        subject: `Update on Order #${order.orderCode}: ${status}`,
        text,
        html,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'ECommerceEngine/1.0',
        },
      });

      this.logger.log(`Order status update email sent to ${to} (MessageId: ${info.messageId})`);
    } catch (error) {
      this.logger.error(`Failed to send order status update email to ${to}:`, error);
    }
  }
}

