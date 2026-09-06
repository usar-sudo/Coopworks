import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.text()).slice(0, 4096);
    if (body.trim()) {
      console.warn('[security/csp-report]', body.slice(0, 1024));
    }
  } catch {
    // ignore malformed reports
  }
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return new NextResponse(null, { status: 204 });
}
