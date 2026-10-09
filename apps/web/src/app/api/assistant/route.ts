import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function normalizeMessages(payload: unknown): AssistantMessage[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as { messages?: unknown; message?: unknown };

  if (Array.isArray(body.messages)) {
    const messages = body.messages
      .filter((message): message is AssistantMessage => {
        if (!message || typeof message !== 'object') return false;
        const candidate = message as Partial<AssistantMessage>;
        return (candidate.role === 'user' || candidate.role === 'assistant')
          && typeof candidate.content === 'string'
          && candidate.content.trim().length > 0;
      })
      .slice(-12)
      .map(({ role, content }) => ({ role, content: content.slice(0, 1200) }));
    return messages.length ? messages : null;
  }

  if (typeof body.message === 'string' && body.message.trim()) {
    return [{ role: 'user', content: body.message.trim().slice(0, 1200) }];
  }

  return null;
}

export async function POST(request: Request) {
  let messages: AssistantMessage[] | null = null;

  try {
    messages = normalizeMessages(await request.json());
  } catch {
    messages = null;
  }

  if (!messages) {
    return NextResponse.json(
      { message: 'Please send a message so OneStop Assistant can help.' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${API_URL}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });

    const rawPayload = await response.text();
    let payload: unknown = {};
    try {
      payload = rawPayload ? JSON.parse(rawPayload) as unknown : {};
    } catch {
      payload = { message: 'OneStop Assistant returned an unexpected response. Please try again.' };
    }

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'OneStop Assistant is unavailable right now. Please try again.' },
      { status: 503 },
    );
  }
}
