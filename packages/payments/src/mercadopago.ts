// Mercado Pago, as ReboSchedule takes payments of it: a preference of
// Checkout Pro for what is held, of the total, that expires when the hold
// does, back to the booking's address; its notice of a payment checked by
// its signature (`x-signature`, of the webhook's secret) and the payment
// asked of the API itself, approved, by whose booking; a refund of it. With
// `fetch`.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Payments } from '@reboschedule/server';

export interface MercadoPagoOptions {
  /** The access token of the application: `APP_USR-…`, `TEST-…`. */
  accessToken: string;
  /** The secret signature of the webhook, to check each notice is Mercado Pago's. */
  webhookSecret: string;
  fetch?: typeof fetch;
}

export function mercadoPagoPayments({ accessToken, webhookSecret, fetch: send = globalThis.fetch.bind(globalThis) }: MercadoPagoOptions): Payments {
  const api = async (path: string, init: { method?: string; body?: unknown; key?: string } = {}) => {
    const answer = await send(`https://api.mercadopago.com/${path}`, {
      method: init.method ?? 'GET',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        ...(init.key ? { 'x-idempotency-key': init.key } : {}),
      },
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
    });
    const body = (await answer.json()) as Record<string, unknown>;
    if (!answer.ok) throw new Error(`Mercado Pago ${answer.status}: ${JSON.stringify(body)}`);
    return body;
  };
  return {
    provider: 'mercadopago',
    async checkout(charge) {
      const preference = await api('checkout/preferences', {
        method: 'POST',
        body: {
          items: [{ id: charge.booking.id, title: `${charge.type.title} · ${charge.organizer.name}`, quantity: 1, unit_price: charge.total.amount, currency_id: charge.total.currency.toUpperCase() }],
          payer: { email: charge.booking.email, name: charge.booking.name },
          external_reference: charge.booking.id,
          notification_url: charge.notify,
          back_urls: { success: `${charge.back}?paid=1`, pending: charge.back, failure: charge.back },
          auto_return: 'approved',
          expires: true,
          expiration_date_to: charge.until,
        },
      });
      return { id: String(preference.id), url: String(preference.init_point) };
    },
    async notified(request) {
      const url = new URL(request.url);
      const body = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
      const id = String(url.searchParams.get('data.id') ?? body.data?.id ?? '');
      if ((body.type ?? url.searchParams.get('type')) !== 'payment' || !id) return null;
      // The signature: `ts=…,v1=…`, of `id:…;request-id:…;ts:…;`.
      const parts = Object.fromEntries((request.headers.get('x-signature') ?? '').split(',').map((p) => p.trim().split('=') as [string, string]));
      const manifest = `id:${id.toLowerCase()};request-id:${request.headers.get('x-request-id') ?? ''};ts:${parts.ts};`;
      const expected = createHmac('sha256', webhookSecret).update(manifest).digest('hex');
      if (!parts.v1 || parts.v1.length !== expected.length || !timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))) return null;
      // What the notice says is asked again of the API: the payment, approved, and whose.
      const payment = await api(`v1/payments/${encodeURIComponent(id)}`);
      if (payment.status !== 'approved' || !payment.external_reference) return null;
      return { booking: String(payment.external_reference), paid: String(payment.id) };
    },
    async refund(booking, amount) {
      if (booking.payment?.paid) await api(`v1/payments/${encodeURIComponent(booking.payment.paid)}/refunds`, { method: 'POST', body: { amount: amount.amount }, key: `refund-${booking.id}` });
    },
  };
}
