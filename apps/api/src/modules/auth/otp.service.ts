import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { Env } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';
import { SMS_PROVIDER, SmsProvider } from './sms/sms.provider';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService<Env, true>,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  private cfg<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  private codeKey = (phone: string) => `otp:code:${phone}`;
  private cooldownKey = (phone: string) => `otp:cooldown:${phone}`;
  private hourlyKey = (phone: string) => `otp:hourly:${phone}`;

  /** The code is never stored in plain text: we keep an HMAC bound to the phone number. */
  private hash(phone: string, code: string): string {
    return createHmac('sha256', this.cfg('OTP_HMAC_SECRET')).update(`${phone}:${code}`).digest('hex');
  }

  async request(phone: string): Promise<{ expiresInSeconds: number; resendAfterSeconds: number }> {
    const ttl = this.cfg('OTP_TTL_SECONDS');
    const resend = this.cfg('OTP_RESEND_SECONDS');

    if (await this.redis.exists(this.cooldownKey(phone))) {
      throw new HttpException('Please wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }

    const hourly = await this.redis.incr(this.hourlyKey(phone));
    if (hourly === 1) await this.redis.expire(this.hourlyKey(phone), 3600);
    if (hourly > this.cfg('OTP_MAX_PER_HOUR')) {
      throw new HttpException('Too many codes requested. Try again later', HttpStatus.TOO_MANY_REQUESTS);
    }

    const isDev = this.cfg('NODE_ENV') === 'development';
    const code = isDev ? '000000' : randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.redis
      .multi()
      .hset(this.codeKey(phone), { hash: this.hash(phone, code), attempts: 0 })
      .expire(this.codeKey(phone), ttl)
      .set(this.cooldownKey(phone), '1', 'EX', resend)
      .exec();

    try {
      await this.sms.send(
        phone,
        `Your verification code is ${code}. It expires in ${Math.ceil(ttl / 60)} minutes. Do not share it.`,
      );
    } catch (err) {
      // Do not lock the user out for a minute because our SMS provider failed.
      await this.redis.del(this.codeKey(phone), this.cooldownKey(phone));
      this.logger.error(`SMS delivery failed for ${phone}: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Could not send the code. Please try again.');
    }

    return { expiresInSeconds: ttl, resendAfterSeconds: resend };
  }

  async verify(phone: string, code: string): Promise<void> {
    const key = this.codeKey(phone);
    const stored = await this.redis.hgetall(key);
    if (!stored.hash) throw new BadRequestException('Code expired or not requested');

    const attempts = await this.redis.hincrby(key, 'attempts', 1);
    if (attempts > this.cfg('OTP_MAX_ATTEMPTS')) {
      await this.redis.del(key);
      throw new HttpException('Too many wrong attempts. Request a new code', HttpStatus.TOO_MANY_REQUESTS);
    }

    const expected = Buffer.from(stored.hash, 'hex');
    const given = Buffer.from(this.hash(phone, code), 'hex');
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
      throw new UnauthorizedException('Invalid code');
    }

    // DEL returns how many keys it removed. If another request consumed the code first, we get 0.
    const consumed = await this.redis.del(key);
    if (consumed !== 1) throw new BadRequestException('Code expired or not requested');
  }
}
