import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

/**
 * Catch-all proxy for API paths that don't have a dedicated route file.
 * Specific routes (orders, products, assistant) take precedence over this.
 */
async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api\//, '');
  const search = request.nextUrl.search;
  const url = `${API_URL}/${path}${search}`;
  const headers: Record<string, string> = {};
  const auth = request.headers.get('authorization');
  if (auth) headers.Authorization = auth;
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  if (hasBody) headers['Content-Type'] = 'application/json';
  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? JSON.stringify(await request.json().catch(() => ({}))) : undefined,
    });
    const text = await response.text();
    let payload: unknown;
    try { payload = JSON.parse(text); } catch { payload = { message: text }; }
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}

export async function GET(request: NextRequest) { return proxy(request); }
export async function POST(request: NextRequest) { return proxy(request); }
export async function PATCH(request: NextRequest) { return proxy(request); }
export async function DELETE(request: NextRequest) { return proxy(request); }
