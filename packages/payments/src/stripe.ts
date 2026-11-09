// Stripe, as ReboSchedule takes payments of it: a Checkout Session for what
// is held, of the total in its currency, back to the booking's address; its
// webhook `checkout.session.completed` checked by its signature (`Stripe-
// Signature`, of the endpoint's secret); a refund of its payment intent.
// By Stripe's API itself, with `fetch`.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Payments } from '@reboschedule/server';

export interface StripeOptions {
  /** The secret key: `sk_live_…`, `sk_test_…`. */
  secretKey: string;
  /** The signing secret of the webhook endpoint, `whsec_…`: the handler's `/paid`, listening to `checkout.session.completed`. */
  webhookSecret: string;
  /** How old a notice may be, in seconds; five minutes unless said. */
  tolerance?: number;
  fetch?: typeof fetch;
}

/** Currencies Stripe counts in whole units, with no cents. */
const WHOLE = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

export function stripePayments({ secretKey, webhookSecret, tolerance = 300, fetch: send = globalThis.fetch.bind(globalThis) }: StripeOptions): Payments {
  const api = async (path: string, form: Record<string, string>) => {
    const answer = await send(`https://api.stripe.com/v1/${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secretKey}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form),
    });
    const body = (await answer.json()) as Record<string, unknown>;
    if (!answer.ok) throw new Error(`Stripe ${answer.status}: ${JSON.stringify(body.error ?? body)}`);
    return body;
  };
  return {
    provider: 'stripe',
    async checkout(charge) {
      const cents = WHOLE.has(charge.total.currency.toUpperCase()) ? 1 : 100;
      // Stripe keeps a session thirty minutes at the least: one paid after the hold ran out is checked again by the server.
      const expires = Math.max(Date.parse(charge.until), Date.now() + 31 * 60_000);
      const session = await api('checkout/sessions', {
        mode: 'payment',
        success_url: `${charge.back}?paid=1`,
        cancel_url: charge.back,
        client_reference_id: charge.booking.id,
        customer_email: charge.booking.email,
        expires_at: String(Math.floor(expires / 1000)),
        'metadata[booking]': charge.booking.id,
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': charge.total.currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]': String(Math.round(charge.total.amount * cents)),
        'line_items[0][price_data][product_data][name]': `${charge.type.title} · ${charge.organizer.name}`,
      });
      return { id: String(session.id), url: String(session.url) };
    },
    async notified(request) {
      const body = await request.text();
      const header = request.headers.get('stripe-signature') ?? '';
      const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
      const signed = header
        .split(',')
        .filter((p) => p.startsWith('v1='))
        .map((p) => p.slice(3));
      const t = Number(parts.t);
      if (!t || Math.abs(Date.now() / 1000 - t) > tolerance) return null;
      const expected = createHmac('sha256', webhookSecret).update(`${t}.${body}`).digest('hex');
      if (!signed.some((v) => v.length === expected.length && timingSafeEqual(Buffer.from(v), Buffer.from(expected)))) return null;
      const event = JSON.parse(body) as { type: string; data: { object: { client_reference_id?: string; payment_status?: string; payment_intent?: string } } };
      const session = event.data.object;
      if (event.type !== 'checkout.session.completed' || session.payment_status !== 'paid' || !session.client_reference_id) return null;
      return { booking: session.client_reference_id, paid: String(session.payment_intent ?? '') };
    },
    async refund(booking, amount) {
      const cents = WHOLE.has(amount.currency.toUpperCase()) ? 1 : 100;
      if (booking.payment?.paid) await api('refunds', { payment_intent: booking.payment.paid, amount: String(Math.round(amount.amount * cents)) });
    },
  };
}
