import { NextResponse } from 'next/server';

/** Maximum request body size in bytes. Anything larger gets a 413 before parsing. */
export const MAX_BODY_BYTES = 256_000;

/** Return a 413 if the body exceeds the limit, otherwise the original request. */
export function enforceRequestBodySize(request: Request): Request | NextResponse {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }
  // For requests without a content-length (e.g. small JSON), the body reader below
  // will enforce the limit when the handler reads it; this header check is the fast path.
  return request;
}

/** Read the request body up to the configured limit and return it as parsed JSON.
 *
 * Use this in place of `await req.json()` in API routes so oversized payloads
 * fail with 413 instead of being accepted and then rejected later.
 */
export async function safeJsonBody(request: Request): Promise<unknown> {
  const stream = request.body;
  if (!stream) {
    return {};
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_BODY_BYTES) {
          throw new Response(JSON.stringify({ error: 'Request body too large' }), {
            status: 413,
            headers: { 'content-type': 'application/json' },
          });
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder().decode(bytes);
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
}

// ---- Simple in-memory rate limiter (per-IP, sliding window) ----
// This is a prototype-grade limiter. Vercel disables in-memory state between
// requests, so for a real production deploy you would move this to a KV store or
// Supabase table. It is left here so the mechanism exists and to harden the local
// dev server. It does not block demo-mode behaviour.

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (bucket.count > maxAttempts) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function clientIp(request: Request): string {
  // Vercel surfaces the client IP in x-forwarded-for; fallback to a stable placeholder
  // so the local dev server can still rate-limit (on localhost) without crashing.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}
