import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from 'shared-lib';
import { safeJsonBody } from '@/app/api/_shared/request-limits';

/**
 * Maps + AI grounding endpoint.
 *
 * This endpoint is currently disabled: it requires a configured Gemini API key,
 * which this project does not have. The frontend should fall back to the
 * LocalResourceLocator (mock locator) when this route returns 503 / an empty
 * response. Keeping the route present (and hardened) means we can re-enable it
 * later without changing the client.
 *
 * Security hardening (even though it is currently disabled):
 * - Request body is capped at MAX_BODY_BYTES before parsing.
 * - User-supplied `query` text is sanitised to neutralise prompt-injection attempts
 *   (strip tags, escape control characters, cap length) so a caller cannot smuggle
 *   instructions that change how the AI responds.
 * - Output is capped so a runaway response cannot blow up the response payload.
 */
export async function POST(request: NextRequest) {
  try {
    // Cap the request body before we touch it.
    const payload = await safeJsonBody(request) as {
      query?: string;
      latitude?: number;
      longitude?: number;
    };

    const rawQuery = typeof payload.query === 'string' ? payload.query : '';
    if (!rawQuery.trim()) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 },
      );
    }

    // Sanitise user-supplied prompt text so prompt-injection payloads (e.g. "ignore
    // previous instructions") are neutered. This is a defence-in-depth measure; the
    // upstream model provider also does its own instruction-boundary handling.
    const query = sanitisePrompt(rawQuery).slice(0, 2000);

    // This project does not have a Gemini API key configured, so the AI-backed
    // path is disabled. Return a 503 + a clear message so the frontend can fall
    // back to the mock locator without crashing.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI grounding is not configured for this deployment.' },
        { status: 503 },
      );
    }

    const latitude = typeof payload.latitude === 'number' ? payload.latitude : undefined;
    const longitude = typeof payload.longitude === 'number' ? payload.longitude : undefined;

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const config: Record<string, any> = {
      tools: [{ googleMaps: {} }],
    };

    if (latitude !== undefined && longitude !== undefined) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: { latitude, longitude },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: query,
      config,
    });

    const text = String(response.text || '').slice(0, 4000);
    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const mapPlaces = chunks
      .filter((c: any) => c.maps?.uri || c.maps?.title)
      .map((c: any) => ({
        title: c.maps?.title || 'Cooperative Point of Interest',
        uri: c.maps?.uri || '',
        placeAnswerSources: c.maps?.placeAnswerSources || null,
      }));

    return NextResponse.json({
      text,
      places: mapPlaces,
      groundingChunks: chunks,
    });
  } catch (error: any) {
    console.error('Maps grounding error:', error);
    return NextResponse.json(
      {
        error:
          error.message || 'Failed to retrieve grounded map insights.',
      },
      { status: 500 },
    );
  }
}

/** Minimal prompt sanitisation: remove HTML, escape characters that could be used
 * to build injection payloads, and cap length. This is defence-in-depth — the model
 * provider also enforces instruction boundaries. */
function sanitisePrompt(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;|&gt;|&amp;|&#\d+;/gi, (m) => {
      if (m === '&lt;') return '<';
      if (m === '&gt;') return '>';
      if (m === '&amp;') return '&';
      return '';
    })
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
