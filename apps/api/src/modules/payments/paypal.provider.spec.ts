import { BadRequestException } from '@nestjs/common';
import { PaypalProvider, isAllowedReturnUrl, paypalConfig, pkrMinorToUsd } from './paypal.provider';

describe('PayPal conversion', () => {
  it('converts paisa to a USD string at the configured rate', () => {
    expect(pkrMinorToUsd(110000, 280)).toBe('3.93'); // Rs. 1,100
    expect(pkrMinorToUsd(250000, 250)).toBe('10.00'); // Rs. 2,500
    expect(pkrMinorToUsd(99, 280)).toBe('0.00');
  });
});

describe('PayPal configuration gating', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });

  it('is unconfigured without merchant credentials', () => {
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;
    expect(paypalConfig()).toBeNull();
  });

  it('refuses to start a payment when unconfigured', async () => {
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;
    const provider = new PaypalProvider();
    await expect(provider.createPayment({
      orderId: 'order-1', amountMinor: 1000, currency: 'PKR', customerPhone: '03001234567',
      returnUrl: 'https://shop.example/checkout/paypal/return', idempotencyKey: 'order-1',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires a return URL even when configured', async () => {
    process.env.PAYPAL_CLIENT_ID = 'client';
    process.env.PAYPAL_CLIENT_SECRET = 'secret';
    const provider = new PaypalProvider();
    await expect(provider.createPayment({
      orderId: 'order-1', amountMinor: 1000, currency: 'PKR', customerPhone: '03001234567',
      idempotencyKey: 'order-1',
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('PayPal return URL origin guard', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });

  it('accepts the live origin when CORS_ORIGIN is a comma-separated list', () => {
    process.env.CORS_ORIGIN = 'https://web-production-b6b696.up.railway.app,http://localhost:3000';
    expect(isAllowedReturnUrl('https://web-production-b6b696.up.railway.app/checkout/paypal/return')).toBe(true);
    expect(isAllowedReturnUrl('http://localhost:3000/checkout/paypal/return')).toBe(true);
  });

  it('rejects foreign and lookalike origins', () => {
    process.env.CORS_ORIGIN = 'https://web-production-b6b696.up.railway.app,http://localhost:3000';
    expect(isAllowedReturnUrl('https://evil.example/checkout/paypal/return')).toBe(false);
    expect(isAllowedReturnUrl('https://web-production-b6b696.up.railway.app.evil.example/return')).toBe(false);
    expect(isAllowedReturnUrl('not a url')).toBe(false);
  });

  it('allows any return URL when no origins are configured', () => {
    delete process.env.CORS_ORIGIN;
    expect(isAllowedReturnUrl('https://shop.example/checkout/paypal/return')).toBe(true);
  });
});
