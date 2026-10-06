import { ConfigService } from '@nestjs/config';
import { Injectable, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { AssistantMessageDto } from './dto/assistant-chat.dto';

function extractBudget(query: string): number | null {
  const underBudget = query.match(/\b(?:under|below|less than|max(?:imum)?|within|budget(?: of)?)\s*(?:(?:rs\.?|pkr|rupees)\s*)?([\d,]+(?:\.\d+)?)/i);
  const currencyAmount = query.match(/\b(?:rs\.?|pkr|rupees)\s*([\d,]+(?:\.\d+)?)/i);
  const rawAmount = underBudget?.[1] ?? currencyAmount?.[1];
  if (!rawAmount) return null;

  const amount = Number(rawAmount.replaceAll(',', ''));
  return Number.isFinite(amount) && amount > 0 ? Math.min(amount, 10_000_000) : null;
}

function isShoppingQuestion(query: string) {
  return /\b(buy|cart|cost|find|looking for|need|price|product|products|recommend|shop|shopping|show|stock|under|available|sell)\b/i.test(query);
}

type AssistantProduct = {
  nameEn: string;
  category: string | null;
  priceMinor: number;
  unit: string;
};

@Injectable()
export class AssistantService {
  constructor(
    private readonly products: ProductsService,
    private readonly config: ConfigService,
  ) {}

  async chat(messages: AssistantMessageDto[]) {
    const lastMessage = messages.at(-1);
    if (lastMessage?.role !== 'user') {
      throw new UnprocessableEntityException('The last chat message must be from the customer.');
    }

    const query = lastMessage.content.trim();
    const budget = extractBudget(query);
    const productMatches: AssistantProduct[] = await this.products.searchForAssistant(query, null, budget);
    const products = isShoppingQuestion(query) || (!query.includes('?') && productMatches.length > 0)
      ? productMatches
      : [];
    const apiKey = this.config.get<string>('XAI_API_KEY');

    if (!apiKey) {
      if (products.length) {
        const budgetNote = budget === null ? '' : ` within Rs. ${budget.toLocaleString('en-PK')}`;
        return {
          reply: `I found these in-stock catalogue matches${budgetNote}. To answer general questions too, add an XAI_API_KEY to the API service on Railway.`,
          products,
          source: 'live_catalog',
        };
      }
      return {
        reply: 'I can search the live product catalogue, but answering general questions needs a Grok API key. Add XAI_API_KEY to the API service environment on Railway, then redeploy it.',
        products: [],
        source: 'live_catalog',
      };
    }

    const catalogContext = productMatches.length
      ? `\n\nPossible current in-stock catalogue matches (use only when relevant; do not invent or change prices):\n${productMatches.map((product) => `- ${product.nameEn}; category: ${product.category ?? 'uncategorized'}; price: Rs. ${(product.priceMinor / 100).toLocaleString('en-PK')}; unit: ${product.unit}`).join('\n')}`
      : '\n\nNo relevant in-stock catalogue items were found for this message. Do not invent products, availability, or prices.';

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.get<string>('XAI_MODEL', 'grok-4.7'),
          messages: [
            {
              role: 'system',
              content: `You are OneStop's helpful, friendly store assistant. Answer the customer's question directly in clear, concise language, even when it is not about shopping. For questions about OneStop, orders, delivery, stock, or policies, only state facts present in the conversation or catalogue; say when you do not know. For medical questions, offer general information only, do not diagnose or prescribe, and advise contacting a qualified clinician for personal care. Never claim to have taken an action. Never make up catalogue items, stock, or prices.${catalogContext}`,
            },
            ...messages.map(({ role, content }) => ({ role, content })),
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        throw new Error(`OpenAI chat request failed with status ${response.status}`);
      }

      const payload = await response.json() as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const reply = payload.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error('OpenAI returned an empty assistant response');

      return { reply, products, source: 'openai_live_catalog' };
    } catch {
      throw new ServiceUnavailableException('The assistant is temporarily unavailable. Please try again shortly.');
    }
  }
}
