import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms.provider';

/** Development only: prints the message to the API console instead of sending it. */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SMS');

  async send(to: string, message: string): Promise<void> {
    this.logger.log(`[DEV ONLY] to ${to}: ${message}`);
  }
}
