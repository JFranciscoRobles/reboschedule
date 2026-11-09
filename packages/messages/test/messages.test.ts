import { type Booking, noticeOf, phoneOf, phoneOfBooking, sampleEventTypes, shortOf } from '@reboschedule/core';
import { describe, expect, it } from 'vitest';
import { twilioMessenger, whatsAppCloudMessenger } from '../src';

const type = { ...sampleEventTypes('es')[1], title: 'Visita', questions: [{ id: 'tel', label: 'WhatsApp', kind: 'phone' as const, required: false }] };
const booking = {
  id: 'b1',
  type: type.id,
  resource: '',
  start: '2026-11-03T17:30:00.000Z',
  end: '2026-11-03T18:30:00.000Z',
  name: 'Ana',
  email: 'a@x.co',
  timeZone: 'America/Tijuana',
  answers: { tel: '664 123 4567' },
  status: 'confirmed',
  created: '2026-11-01T00:00:00.000Z',
} as Booking;
const organizer = { name: 'Rebo Barber', email: 'b@x.co' };

const fake = (answer: unknown) => {
  const asked: { url: string; init?: RequestInit }[] = [];
  const send = (async (url: string, init?: RequestInit) => (asked.push({ url, init }), new Response(JSON.stringify(answer), { status: 200 }))) as typeof fetch;
  return { asked, send };
};

describe('a short message', () => {
  it('takes the phone as a provider wants it', () => {
    expect(phoneOf('664 123 4567')).toBe('+526641234567');
    expect(phoneOf('+1 (555) 123-4567')).toBe('+15551234567');
    expect(phoneOf('123')).toBeNull();
    expect(phoneOfBooking(booking, type)).toBe('+526641234567');
  });

  it('says a reminder in a line, with its link, and as a template’s parts', () => {
    const m = shortOf(noticeOf('reminder', booking, type, organizer, { locale: 'es' }), type, organizer, { locale: 'es', phone: '+526641234567', link: 'https://x.co/s/b/t' })!;
    expect(m.text).toMatch(/^Rebo Barber: te recordamos tu visita, mar.* 3 nov.*9:30.*Cambiar o cancelar: https:\/\/x\.co\/s\/b\/t$/);
    expect(m.template).toMatchObject({ name: 'reboschedule_reminder', params: ['Rebo Barber', 'tu visita', expect.stringContaining('3'), 'https://x.co/s/b/t'] });
    expect(shortOf(noticeOf('booked', booking, type, organizer), type, organizer, { phone: null })).toBeNull();
  });
});

describe('sent', () => {
  const message = shortOf(noticeOf('reminder', booking, type, organizer, { locale: 'es' }), type, organizer, { locale: 'es', phone: '+526641234567', link: 'https://x.co/l' })!;

  it('by Twilio: an SMS as text; a WhatsApp as its approved template', async () => {
    const sms = fake({ sid: 'SM1' });
    expect(await twilioMessenger({ accountSid: 'AC1', authToken: 't', from: '+15550000000', fetch: sms.send }).send(message)).toEqual({ id: 'SM1' });
    const form = new URLSearchParams(String(sms.asked[0].init?.body));
    expect(form.get('To')).toBe('+526641234567');
    expect(form.get('Body')).toBe(message.text);
    const wa = fake({ sid: 'SM2' });
    await twilioMessenger({ accountSid: 'AC1', authToken: 't', from: '+15550000000', channel: 'whatsapp', templates: { reboschedule_reminder: 'HX1' }, fetch: wa.send }).send(message);
    const waForm = new URLSearchParams(String(wa.asked[0].init?.body));
    expect(waForm.get('To')).toBe('whatsapp:+526641234567');
    expect(waForm.get('ContentSid')).toBe('HX1');
    expect(JSON.parse(waForm.get('ContentVariables')!)['4']).toBe('https://x.co/l');
  });

  it('by WhatsApp’s Cloud API, its template filled', async () => {
    const { asked, send } = fake({ messages: [{ id: 'wamid.1' }] });
    await whatsAppCloudMessenger({ accessToken: 't', phoneNumberId: '99', templates: { reboschedule_reminder: 'recordatorio' }, fetch: send }).send(message);
    expect(asked[0].url).toBe('https://graph.facebook.com/v21.0/99/messages');
    const body = JSON.parse(String(asked[0].init?.body));
    expect(body).toMatchObject({ to: '526641234567', type: 'template', template: { name: 'recordatorio', language: { code: 'es_MX' } } });
    expect(body.template.components[0].parameters).toHaveLength(4);
  });
});
