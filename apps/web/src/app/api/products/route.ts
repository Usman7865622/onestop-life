import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/products`, { cache: 'no-store' });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ items: [], error: 'Product API unavailable' }, { status: 503 });
  }
}