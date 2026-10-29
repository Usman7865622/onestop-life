import { BadRequestException } from '@nestjs/common';
import { PaypalProvider, paypalConfig, pkrMinorToUsd } from './paypal.provider';

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
