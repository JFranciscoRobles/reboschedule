// Short messages to a phone, as the application's provider sends them: an
// SMS or a WhatsApp by Twilio, or a WhatsApp by Meta's Cloud API. A message
// that begins a conversation (a reminder, a place freed) goes as a template
// the business had approved, its parts filled; the text whole otherwise. By
// each provider's API itself, with `fetch`.

import type { ShortMessage } from '@reboschedule/core';

/** What sends a short message: by SMS or by WhatsApp. */
export interface Messenger {
  channel: 'sms' | 'whatsapp';
  send(message: ShortMessage): Promise<{ id: string }>;
}

export interface TwilioOptions {
  accountSid: string;
  authToken: string;
  /** The number it is sent from, `+15551234567`; for WhatsApp, the sender Twilio gave. */
  from: string;
  channel?: 'sms' | 'whatsapp';
  /** The Content SID of each template approved, by the template's name (`reboschedule_reminder`): sent as it, its parts as its variables. */
  templates?: Record<string, string>;
  fetch?: typeof fetch;
}

export function twilioMessenger({ accountSid, authToken, from, channel = 'sms', templates = {}, fetch: send = globalThis.fetch.bind(globalThis) }: TwilioOptions): Messenger {
  const as = (n: string) => (channel === 'whatsapp' ? `whatsapp:${n}` : n);
  return {
    channel,
    async send(message) {
      const content = templates[message.template.name];
      const form = new URLSearchParams({ To: as(message.to), From: as(from) });
      if (content) {
        form.set('ContentSid', content);
        form.set('ContentVariables', JSON.stringify(Object.fromEntries(message.template.params.map((p, i) => [String(i + 1), p]))));
      } else form.set('Body', message.text);
      const answer = await send(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
        method: 'POST',
        headers: { authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`, 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      const body = (await answer.json()) as { sid?: string; message?: string };
      if (!answer.ok) throw new Error(`Twilio ${answer.status}: ${body.message ?? ''}`);
      return { id: String(body.sid) };
    },
  };
}

export interface WhatsAppCloudOptions {
  /** A token of the app at Meta, with `whatsapp_business_messaging`. */
  accessToken: string;
  /** The id of the number it is sent from, at Meta. */
  phoneNumberId: string;
  /** The name each template has at Meta, by its name here (`reboschedule_reminder`); none, the text whole (only in a conversation open these 24 hours). */
  templates?: Record<string, string>;
  /** The language of the templates: `es_MX`, `en_US`. */
  language?: string;
  version?: string;
  fetch?: typeof fetch;
}

export function whatsAppCloudMessenger({
  accessToken,
  phoneNumberId,
  templates = {},
  language = 'es_MX',
  version = 'v21.0',
  fetch: send = globalThis.fetch.bind(globalThis),
}: WhatsAppCloudOptions): Messenger {
  return {
    channel: 'whatsapp',
    async send(message) {
      const name = templates[message.template.name];
      const to = message.to.replace(/^\+/, '');
      const body = name
        ? {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: { name, language: { code: language }, components: [{ type: 'body', parameters: message.template.params.map((text) => ({ type: 'text', text })) }] },
          }
        : { messaging_product: 'whatsapp', to, type: 'text', text: { body: message.text, preview_url: true } };
      const answer = await send(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}/messages`, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const said = (await answer.json()) as { messages?: { id: string }[]; error?: { message?: string } };
      if (!answer.ok) throw new Error(`WhatsApp ${answer.status}: ${said.error?.message ?? ''}`);
      return { id: said.messages?.[0]?.id ?? '' };
    },
  };
}
