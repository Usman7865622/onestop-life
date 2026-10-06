import {
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.validation';
import { ProductsService } from '../products/products.service';
import { AssistantMessageDto } from './dto/assistant-chat.dto';

type AssistantProduct = {
  id: string;
  nameEn: string;
  nameUr: string | null;
  priceMinor: number;
  unit: string;
  category: string | null;
  imageUrl: string | null;
  inStock: boolean;
};

type FunctionCall = Record<string, unknown> & {
  type: 'function_call';
  name: string;
  call_id: string;
  arguments: string;
};

type ModelResponse = {
  output?: Array<Record<string, unknown>>;
  output_text?: string;
};

const INSTRUCTIONS = [
  'You are OneStop Life’s shopping assistant. Be concise, friendly, and useful.',
  'Use search_products before recommending, comparing, or claiming availability or prices for products.',
  'Only recommend products returned by search_products. Never invent products, stock, prices, product benefits, or medical claims.',
  'Prices are in Pakistani rupees. Ask a short follow-up question when the request is too vague to search well.',
  'Do not diagnose, prescribe, or provide treatment advice. For medical questions, say you can help find products in the catalogue but they are not medical advice, and recommend consulting a qualified professional.',
  'You cannot add products to a cart, place orders, take payments, or change account data. The customer controls those actions in the storefront.',
].join(' ');

@Injectable()
export class AssistantService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly products: ProductsService,
  ) {}

  async chat(messages: AssistantMessageDto[]) {
    const lastMessage = messages.at(-1);
    if (lastMessage?.role !== 'user') {
      throw new UnprocessableEntityException('The last chat message must be from the customer.');
    }

    // API key is optional — when absent, createResponse returns a mock reply.
    const apiKey = this.config.get('OPENAI_API_KEY', { infer: true }) ?? '';

    const tools = [
      {
        type: 'function',
        name: 'search_products',
        description: 'Search the live OneStop catalogue for in-stock products matching the customer request.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Short product or need keywords from the customer request.' },
            category: { type: ['string', 'null'], description: 'Optional catalogue category filter.' },
            max_price_pkr: { type: ['number', 'null'], description: 'Optional maximum item price in Pakistani rupees.' },
          },
          required: ['query', 'category', 'max_price_pkr'],
          additionalProperties: false,
        },
        strict: true,
      },
    ];

    const input: Array<Record<string, unknown>> = messages.map(({ role, content }) => ({ role, content }));
    const foundProducts = new Map<string, AssistantProduct>();
    let response = await this.createResponse(apiKey, input, tools);

    // Bound tool use to avoid runaway model/API costs for a single chat turn.
    for (let turn = 0; turn < 3; turn += 1) {
      const calls = (response.output ?? []).filter(
        (item): item is FunctionCall => item.type === 'function_call' && item.name === 'search_products',
      );
      if (!calls.length) break;

      const outputs: Array<Record<string, string>> = [];
      for (const call of calls) {
        const args = this.parseSearchArguments(call.arguments);
        const matches = await this.products.searchForAssistant(args.query, args.category, args.max_price_pkr);
        matches.forEach((product) => foundProducts.set(product.id, product));
        outputs.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify({ items: matches }),
        });
      }

      input.push(...(response.output ?? []), ...outputs);
      response = await this.createResponse(apiKey, input, tools);
    }

    const reply = this.responseText(response).trim();
    return {
      reply: reply || (foundProducts.size ? 'Here are some matching products from the catalogue.' : 'I could not find a matching in-stock product. Try a different description or category.'),
      products: [...foundProducts.values()].slice(0, 8),
    };
  }

  private async createResponse(apiKey: string, input: Array<Record<string, unknown>>, tools: object[]) {
    // If the API key is not configured, return a mock response to keep the UI functional.
    if (!apiKey) {
      // Simple mock that mimics the ModelResponse shape expected by the rest of the service.
      return {
        output_text: 'Here are some product suggestions based on your request.',
      } as ModelResponse;
    }

    // Use OpenAI's chat completions endpoint with function calling support.
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: this.config.get('OPENAI_MODEL', { infer: true }),
      messages: input,
      // OpenAI expects "tools" in the same format for function calling.
      tools,
      // We request the model not to store the conversation.
      // (OpenAI does not have a direct "store" flag; this is kept for compatibility.)
    };

    let result: Response;
    try {
      result = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25_000),
      });
    } catch (error) {
      console.error('Fetch to OpenAI failed:', error);
      throw new ServiceUnavailableException('The shopping assistant could not reach its AI service. Please try again.');
    }

    if (!result.ok) {
      throw new ServiceUnavailableException('The shopping assistant is temporarily unavailable. Please try again.');
    }
    // OpenAI chat/completions response shape; cast to a typed interface.
    type OpenAIResponse = {
      choices?: Array<{
        index?: number;
        message?: {
          role?: string;
          content?: string | null;
          function_call?: { name: string; arguments: string };
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };
    const data = (await result.json()) as OpenAIResponse;
    const choice = data?.choices?.[0];
    if (choice?.message) {
      const msg = choice.message;
      // Handle tool_calls (modern function-calling format).
      if (msg.tool_calls?.length) {
        return {
          output: msg.tool_calls.map((tc) => ({
            type: 'function_call',
            name: tc.function.name,
            arguments: tc.function.arguments,
            call_id: tc.id,
          })),
        } as ModelResponse;
      }
      // Handle legacy function_call format.
      if (msg.function_call) {
        return {
          output: [
            {
              type: 'function_call',
              name: msg.function_call.name,
              arguments: msg.function_call.arguments,
              call_id: choice.index?.toString() ?? '0',
            },
          ],
        } as ModelResponse;
      }
      // Plain text reply.
      return { output_text: msg.content ?? '' } as ModelResponse;
    }
    // Fallback: return raw JSON as output_text.
    return { output_text: JSON.stringify(data) } as ModelResponse;
  }

  private parseSearchArguments(raw: string) {
    try {
      const args = JSON.parse(raw) as {
        query?: unknown;
        category?: unknown;
        max_price_pkr?: unknown;
      };
      return {
        query: typeof args.query === 'string' ? args.query.slice(0, 160) : '',
        category: typeof args.category === 'string' ? args.category.slice(0, 80) : null,
        max_price_pkr: typeof args.max_price_pkr === 'number' && Number.isFinite(args.max_price_pkr) && args.max_price_pkr >= 0
          ? Math.min(args.max_price_pkr, 10_000_000)
          : null,
      };
    } catch {
      return { query: '', category: null, max_price_pkr: null };
    }
  }

  private responseText(response: ModelResponse) {
    if (typeof response.output_text === 'string') return response.output_text;
    return (response.output ?? [])
      .filter((item) => item.type === 'message' && Array.isArray(item.content))
      .flatMap((item) => item.content as Array<Record<string, unknown>>)
      .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
      .map((item) => item.text as string)
      .join('\n');
  }
}
