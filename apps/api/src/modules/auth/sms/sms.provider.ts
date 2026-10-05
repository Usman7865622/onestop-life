export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SmsProvider {
  /** Sends a text message to an E.164 number. Must throw if delivery could not be started. */
  send(toE164: string, message: string): Promise<void>;
}
