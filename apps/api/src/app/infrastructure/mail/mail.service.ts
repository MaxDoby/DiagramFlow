import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

@Injectable()
export class MailService {
  private readonly transporter?: Transporter;
  private readonly brevoApiKey?: string;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.getOrThrow<string>('MAIL_FROM');

    const provider = this.configService.get<'smtp' | 'brevo'>(
      'MAIL_PROVIDER',
      'smtp',
    );

    if (provider === 'brevo') {
      this.brevoApiKey = this.configService.getOrThrow<string>('BREVO_API_KEY');
      return;
    }

    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = this.configService.getOrThrow<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user && password
        ? {
            auth: {
              user,
              pass: password,
            },
          }
        : {}),
    });
  }

  async send(input: SendEmailInput): Promise<void> {
    if (this.brevoApiKey) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.from },
          to: [{ email: input.to }],
          subject: input.subject,
          textContent: input.text,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Brevo email delivery failed with status ${response.status}`,
        );
      }

      return;
    }

    if (!this.transporter) {
      throw new Error('Mail transport is not configured');
    }

    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  }
}
