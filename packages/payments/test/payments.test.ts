import { createHmac } from 'node:crypto';
import { type Booking, sampleEventTypes } from '@reboschedule/core';
import type { Charge } from '@reboschedule/server';
import { describe, expect, it } from 'vitest';
import { mercadoPagoPayments, stripePayments } from '../src';

const booking = { id: 'bk1', email: 'ana@x.co', name: 'Ana', payment: { provider: 'x', id: 'p', paid: 'pay_1' } } as Booking;
const charge: Charge = {
  booking,
  bookings: [booking],
  total: { amount: 360, currency: 'MXN' },
  type: sampleEventTypes('es')[0],
  organizer: { name: 'Cine', email: 'c@x.co' },
  until: new Date(Date.now() + 10 * 60_000).toISOString(),
  back: 'https://x.co/s/b/tok',
  notify: 'https://x.co/s/paid',
};

/** A fetch that keeps what it is asked, and answers each address as said. */
const fake = (answers: Record<string, unknown>) => {
  const asked: { url: string; init?: RequestInit }[] = [];
  const send = (async (url: string, init?: RequestInit) => {
    asked.push({ url, init });
    const key = Object.keys(answers).find((k) => url.includes(k));
    return new Response(JSON.stringify(key ? answers[key] : {}), { status: key ? 200 : 404 });
  }) as typeof fetch;
  return { asked, send };
};

describe('Stripe', () => {
  it('begins a Checkout Session of the total, in cents, back to the booking', async () => {
    const { asked, send } = fake({ 'checkout/sessions': { id: 'cs_1', url: 'https://checkout.stripe.com/cs_1' } });
    const stripe = stripePayments({ secretKey: 'sk_test', webhookSecret: 'whsec', fetch: send });
    expect(await stripe.checkout(charge)).toEqual({ id: 'cs_1', url: 'https://checkout.stripe.com/cs_1' });
    const form = new URLSearchParams(String(asked[0].init?.body));
    expect(form.get('line_items[0][price_data][unit_amount]')).toBe('36000');
    expect(form.get('line_items[0][price_data][currency]')).toBe('mxn');
    expect(form.get('client_reference_id')).toBe('bk1');
    expect(form.get('success_url')).toBe('https://x.co/s/b/tok?paid=1');
  });

  it('reads a notice signed by the endpoint, and no other', async () => {
    const stripe = stripePayments({ secretKey: 'sk_test', webhookSecret: 'whsec' });
    const body = JSON.stringify({ type: 'checkout.session.completed', data: { object: { client_reference_id: 'bk1', payment_status: 'paid', payment_intent: 'pi_9' } } });
    const t = Math.floor(Date.now() / 1000);
    const sign = (secret: string) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;
    const notice = (signature: string) => new Request('https://x.co/s/paid', { method: 'POST', body, headers: { 'stripe-signature': signature } });
    expect(await stripe.notified(notice(sign('whsec')))).toEqual({ booking: 'bk1', paid: 'pi_9' });
    expect(await stripe.notified(notice(sign('another')))).toBeNull();
  });
});

describe('Mercado Pago', () => {
  it('begins a preference that runs out with the hold, and tells where to notify', async () => {
    const { asked, send } = fake({ 'checkout/preferences': { id: 'pref_1', init_point: 'https://mercadopago.com/pay/pref_1' } });
    const mp = mercadoPagoPayments({ accessToken: 'TEST', webhookSecret: 's', fetch: send });
    expect(await mp.checkout(charge)).toEqual({ id: 'pref_1', url: 'https://mercadopago.com/pay/pref_1' });
    const sent = JSON.parse(String(asked[0].init?.body));
    expect(sent).toMatchObject({ external_reference: 'bk1', notification_url: 'https://x.co/s/paid', expires: true, expiration_date_to: charge.until });
    expect(sent.items[0]).toMatchObject({ unit_price: 360, currency_id: 'MXN', quantity: 1 });
  });

  it('checks the signature, then asks the payment itself: approved, whose', async () => {
    const { send } = fake({ 'v1/payments/123': { id: 123, status: 'approved', external_reference: 'bk1' } });
    const mp = mercadoPagoPayments({ accessToken: 'TEST', webhookSecret: 's', fetch: send });
    const v1 = createHmac('sha256', 's').update('id:123;request-id:rq;ts:1700;').digest('hex');
    const notice = (signature: string) =>
      new Request('https://x.co/s/paid?data.id=123&type=payment', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment', data: { id: '123' } }),
        headers: { 'x-signature': signature, 'x-request-id': 'rq' },
      });
    expect(await mp.notified(notice(`ts=1700,v1=${v1}`))).toEqual({ booking: 'bk1', paid: '123' });
    expect(await mp.notified(notice('ts=1700,v1=bad'))).toBeNull();
  });

  it('refunds what was paid', async () => {
    const { asked, send } = fake({ refunds: { id: 1 } });
    await mercadoPagoPayments({ accessToken: 'TEST', webhookSecret: 's', fetch: send }).refund?.(booking, { amount: 180, currency: 'MXN' });
    expect(asked[0].url).toBe('https://api.mercadopago.com/v1/payments/pay_1/refunds');
  });
});
