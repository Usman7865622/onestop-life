import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/orders/validate-discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await request.json()),
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Discount service unavailable' }, { status: 503 });
  }
}
