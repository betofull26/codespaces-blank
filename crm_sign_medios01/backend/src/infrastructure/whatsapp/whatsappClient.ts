import { config } from '../../common/config.js';

type SendResult = { ok: boolean; externalMessageId: string | null; status?: number; bodyText?: string };

const rateLimitPerMinute = Number(process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE ?? 60);
const maxRetriesDefault = Number(process.env.WHATSAPP_SEND_RETRIES ?? 3);
const baseBackoffMs = Number(process.env.WHATSAPP_SEND_BACKOFF_MS ?? 500);

// simple token-bucket rate limiter
class RateLimiter {
  capacity: number;
  tokens: number;
  lastRefill: number;
  refillRatePerMs: number;

  constructor(perMinute: number) {
    this.capacity = perMinute;
    this.tokens = perMinute;
    this.lastRefill = Date.now();
    this.refillRatePerMs = perMinute / 60000; // tokens per ms
  }

  refill() {
    const now = Date.now();
    const delta = now - this.lastRefill;
    if (delta <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + delta * this.refillRatePerMs);
    this.lastRefill = now;
  }

  async removeToken() {
    // wait until at least 1 token available
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

const limiter = new RateLimiter(rateLimitPerMinute);

// metrics
let totalRequests = 0;
let totalSuccess = 0;
let totalFailures = 0;
let totalRetries = 0;
let totalRateLimitedWaits = 0;

export const getMetrics = () => ({ totalRequests, totalSuccess, totalFailures, totalRetries, totalRateLimitedWaits });

const parseExternalId = async (resp: Response | null): Promise<string | null> => {
  if (!resp) return null;
  try {
    const body = await resp.json().catch(() => null);
    return body?.messageId ?? body?.id ?? body?.messages?.[0]?.id ?? null;
  } catch (e) {
    return null;
  }
};

export const sendTextMessage = async (to: string, text: string, opts?: { maxRetries?: number; baseDelayMs?: number }): Promise<SendResult> => {
  totalRequests += 1;
  const maxRetries = opts?.maxRetries ?? maxRetriesDefault;
  const baseDelay = opts?.baseDelayMs ?? baseBackoffMs;

  const waUrl = config.whatsappSendUrl;
  if (!waUrl) {
    console.error('WhatsApp API URL not configured');
    return { ok: false, externalMessageId: null, status: 0, bodyText: 'WHATSAPP_API_URL not configured' };
  }

  let lastResp: Response | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // rate limiter: ensure we have a token
    const before = Date.now();
    const tokensBefore = limiter.tokens;
    await limiter.removeToken();
    if (limiter.tokens < tokensBefore) totalRateLimitedWaits += 1;

    try {
      const resp = await fetch(waUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.whatsappToken}`,
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
      });

      lastResp = resp;
      if (resp.ok) {
        totalSuccess += 1;
        const externalMessageId = await parseExternalId(resp);
        return { ok: true, externalMessageId };
      }

      totalRetries += 1;
      const tb = await resp.text().catch(() => '<no-body>');
      console.error(`WhatsApp send attempt ${attempt} failed: ${resp.status} ${tb}`);
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      totalRetries += 1;
      console.error(`WhatsApp send attempt ${attempt} error:`, err instanceof Error ? err.message : err);
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  totalFailures += 1;
  const externalMessageId = await parseExternalId(lastResp);
  return { ok: false, externalMessageId, status: lastResp?.status, bodyText: lastResp ? await lastResp.text().catch(() => '') : undefined };
};

export default { sendTextMessage, getMetrics };
