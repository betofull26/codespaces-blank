import type { WhatsAppInboundPayload } from '../../../application/useCases.js';

const safeString = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

const unixToIso = (v: string | number | undefined): string | undefined => {
  if (v == null) return undefined;
  const n = typeof v === 'string' && /^[0-9]+$/.test(v) ? Number(v) : typeof v === 'number' ? v : NaN;
  if (Number.isNaN(n)) return safeString(String(v));
  // Meta timestamp is seconds since epoch
  return new Date(n * 1000).toISOString();
};

export const parseMetaWebhook = (body: any): WhatsAppInboundPayload | null => {
  if (!body || typeof body !== 'object') return null;

  // If already in expected shape, return quickly
  if (body.phone && (body.text || body.t) ) {
    return {
      phone: safeString(body.phone) ?? '',
      clientName: safeString(body.clientName) ?? undefined,
      text: safeString(body.text ?? body.t) ?? '',
      timestamp: safeString(body.timestamp) ?? new Date().toISOString(),
      externalMessageId: safeString(body.externalMessageId) ?? undefined,
    };
  }

  // Meta Graph webhook shape: entry[].changes[].value with messages[] or statuses[]
  const entries = Array.isArray(body.entry) ? body.entry : [body];

  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [entry.change].filter(Boolean);
    for (const change of changes) {
      const value = change?.value ?? entry?.value ?? change;
      if (!value || typeof value !== 'object') continue;

      // most webhooks include messages array for inbound text
      const messages = Array.isArray(value.messages) ? value.messages : [];
      if (messages.length > 0) {
        const msg = messages[0];
        const from = safeString(msg.from) ?? safeString(msg.to) ?? undefined;
        const contact = Array.isArray(value.contacts) ? value.contacts[0] : value.contact ?? null;
        const name = contact?.profile?.name ?? contact?.name ?? undefined;
        // text can be in different places depending on message type
        const text = safeString(msg.text?.body) ?? safeString(msg.message?.text?.body) ?? safeString(msg?.body) ?? '';
        const timestamp = unixToIso(msg.timestamp ?? value.timestamp ?? undefined) ?? new Date().toISOString();
        const externalMessageId = safeString(msg.id) ?? safeString(msg.message_id) ?? undefined;

        if (from && text !== undefined) {
          return {
            phone: from,
            clientName: name,
            text,
            timestamp,
            externalMessageId,
          };
        }
      }

      // fallback: statuses (outbound) or single-contact notifications
      const statuses = Array.isArray(value.statuses) ? value.statuses : [];
      if (statuses.length > 0) {
        const st = statuses[0];
        const phone = safeString(st.recipient_id) ?? safeString(st.to) ?? undefined;
        const externalMessageId = safeString(st.id) ?? safeString(st.message_id) ?? undefined;
        const timestamp = unixToIso(st.timestamp ?? value.timestamp ?? undefined) ?? new Date().toISOString();
        if (phone) {
          return { phone, clientName: undefined, text: '', timestamp, externalMessageId };
        }
      }
    }
  }

  return null;
};

export default parseMetaWebhook;
