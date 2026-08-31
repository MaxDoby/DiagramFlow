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
  private readonly transporter: Transporter;
  private readonly from: string;
  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = this.configService.getOrThrow<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    this.from = this.configService.getOrThrow<string>('MAIL_FROM');

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
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  }
}
