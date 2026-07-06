import { buildErrorResponse } from '../../../common/apiResponse.js';
import { config } from '../../../common/config.js';

export interface SanitizedInbound {
  phone: string | null;
  clientName?: string | null;
  text: string | null;
  timestamp?: string | null;
  externalMessageId?: string | null;
}

const stripControl = (s: string): string => s.replace(/[\x00-\x1F\x7F]/g, '');

export const sanitizeText = (t: unknown, maxLen = 4096): string | null => {
  if (t == null) return null;
  const s = String(t).trim();
  if (s.length === 0) return null;
  const cleaned = stripControl(s).slice(0, maxLen);
  return cleaned;
};

export const normalizePhone = (p: unknown): string | null => {
  if (p == null) return null;
  let s = String(p).trim();
  if (s.length === 0) return null;
  // keep digits and plus
  s = s.replace(/[^+0-9]/g, '');

  // handle leading 00 -> +
  if (s.startsWith('00')) s = '+' + s.slice(2);

  // if already starts with + treat as E.164 candidate
  if (s.startsWith('+')) {
    const digits = s.replace(/[^0-9]/g, '');
    if (digits.length < 7 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // plain national number: prepend default country code from config
  const defaultCode = String(config.defaultPhoneCountryCode ?? '54').replace(/[^0-9]/g, '');
  let digits = s.replace(/[^0-9]/g, '');

  // if digits already looks like it contains country code (>=11) assume it's E.164 without +
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  // otherwise prepend default country code
  const full = `${defaultCode}${digits}`;
  if (full.length < 7 || full.length > 15) return null;
  return `+${full}`;
};

export const sanitizeInbound = (raw: any): { ok: true; value: SanitizedInbound } | { ok: false; error: any } => {
  try {
    const phone = normalizePhone(raw?.phone ?? raw?.from ?? raw?.wa_from ?? raw?.sender ?? null);
    const clientName = raw?.clientName ? String(raw.clientName).trim() : raw?.profile?.name ?? null;
    const text = sanitizeText(raw?.text ?? raw?.message ?? raw?.body ?? raw?.t ?? null);
    const timestamp = raw?.timestamp ? String(raw.timestamp).trim() : null;
    const externalMessageId = raw?.externalMessageId ?? raw?.id ?? raw?.message_id ?? null;

    // If this looks like a status-only message (no text) allow with null text
    if (!phone && !text) {
      return { ok: false, error: buildErrorResponse('Invalid payload: phone or text required', 'INVALID_PAYLOAD') };
    }

    return {
      ok: true,
      value: {
        phone: phone ?? null,
        clientName: clientName ?? null,
        text: text ?? null,
        timestamp: timestamp ?? null,
        externalMessageId: externalMessageId ?? null,
      },
    };
  } catch (e) {
    return { ok: false, error: buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD') };
  }
};

export const sanitizeSendPayload = (payload: any): { ok: true; phone: string | null; text: string } | { ok: false; error: any } => {
  const text = sanitizeText(payload?.text ?? null);
  if (!text) return { ok: false, error: buildErrorResponse('Text is required', 'INVALID_PAYLOAD') };

  const phoneRaw = payload?.phone ?? null;
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;

  return { ok: true, phone, text };
};

export default { sanitizeInbound, sanitizeSendPayload };
