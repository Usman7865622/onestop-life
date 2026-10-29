import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentMethod,
  PaymentProvider,
  WebhookEvent,
} from './payment-provider.interface';

export type PaypalConfig = { clientId: string; clientSecret: string; base: string; usdRate: number };

/**
 * PayPal REST configuration from the environment. Returns null when the
 * merchant credentials are absent — the module then leaves PayPal
 * unregistered, so checkout never offers a method that cannot run.
 * PAYPAL_ENV=sandbox (default) talks to the sandbox API; =live is production.
 * PAYPAL_USD_RATE is how many PKR equal 1 USD: PayPal does not settle PKR,
 * so PKR totals are converted at this rate and charged in USD.
 */
export function paypalConfig(): PaypalConfig | null {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const base = (process.env.PAYPAL_ENV ?? 'sandbox').toLowerCase() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  const parsed = Number(process.env.PAYPAL_USD_RATE ?? '280');
  return { clientId, clientSecret, base, usdRate: Number.isFinite(parsed) && parsed > 0 ? parsed : 280 };
}

/** Convert an integer paisa amount to the USD string PayPal expects ("3.93"). */
export function pkrMinorToUsd(amountMinor: number, usdRate: number): string {
  return (amountMinor / 100 / usdRate).toFixed(2);
}


/**
 * A PayPal return URL is only ever allowed back to a storefront origin.
 * CORS_ORIGIN may hold several comma-separated origins (live site +
 * localhost in production), so the return URL's origin must exactly
 * equal one configured entry — never a raw prefix match.
 */
export function isAllowedReturnUrl(returnUrl: string): boolean {
  const allowed = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.startsWith('http'));
  if (!allowed.length) return true;
  try {
    return allowed.includes(new URL(returnUrl).origin);
  } catch {
    return false;
  }
}

/**
 * PayPal Checkout adapter (server-side Orders v2 flow):
 * createPayment creates a PayPal order and returns its approval link;
 * the customer approves on PayPal's site and returns to our return page,
 * which calls PaymentsService.capturePaypal -> captureOrder here. Money is
 * only marked paid after PayPal confirms the capture AND the captured
 * amount matches the order total at the configured rate.
 */
@Injectable()
export class PaypalProvider implements PaymentProvider {
  readonly method: PaymentMethod = 'PAYPAL';
  private readonly logger = new Logger(PaypalProvider.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;

  private config(): PaypalConfig {
    const cfg = paypalConfig();
    if (!cfg) throw new BadRequestException('PayPal is not configured on this server');
    return cfg;
  }

  private async accessToken(cfg: PaypalConfig): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 30_000) return this.tokenCache.token;
    const res = await fetch(`${cfg.base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      this.logger.error(`PayPal auth failed with status ${res.status}`);
      throw new BadRequestException('PayPal authentication failed');
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const cfg = this.config();
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new BadRequestException('amountMinor must be a positive integer (paisa)');
    }
    if (!input.returnUrl) throw new BadRequestException('A return URL is required for PayPal checkout');
    // Only ever send customers back to our own storefront origin.
    if (!isAllowedReturnUrl(input.returnUrl)) {
      throw new BadRequestException('Return URL must be on the storefront origin');
    }
    const token = await this.accessToken(cfg);
    const separator = input.returnUrl.includes('?') ? '&' : '?';
    const res = await fetch(`${cfg.base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': input.idempotencyKey,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: input.orderId,
          custom_id: input.orderId,
          description: 'OneStop Life order',
          amount: { currency_code: 'USD', value: pkrMinorToUsd(input.amountMinor, cfg.usdRate) },
        }],
        application_context: {
          brand_name: 'OneStop Life',
          user_action: 'PAY_NOW',
          return_url: input.returnUrl,
          cancel_url: `${input.returnUrl}${separator}cancel=1`,
        },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; links?: Array<{ rel: string; href: string }> };
    if (!res.ok || !data.id) {
      this.logger.error(`PayPal create order failed with status ${res.status}`);
      throw new BadRequestException('Unable to start PayPal checkout');
    }
    const approve = data.links?.find((link) => link.rel === 'payer-action' || link.rel === 'approve');
    if (!approve) throw new BadRequestException('PayPal did not return an approval link');
    return { providerReference: data.id, status: 'REQUIRES_ACTION', redirectUrl: approve.href };
  }

  /** Capture an approved order; returns what PayPal actually captured for verification. */
  async captureOrder(paypalOrderId: string): Promise<{ status: string; value: string; currency: string }> {
    const cfg = this.config();
    const token = await this.accessToken(cfg);
    const res = await fetch(`${cfg.base}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      purchase_units?: Array<{ payments?: { captures?: Array<{ amount?: { value: string; currency_code: string } }> } }>;
    };
    if (!res.ok) {
      this.logger.error(`PayPal capture failed with status ${res.status}`);
      throw new BadRequestException('PayPal capture failed');
    }
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    return { status: data.status ?? '', value: capture?.amount?.value ?? '', currency: capture?.amount?.currency_code ?? '' };
  }

  parseWebhook(): WebhookEvent | null {
    return null; // Payment is confirmed through the capture call, not webhooks.
  }
}
