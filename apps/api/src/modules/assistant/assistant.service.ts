import { Injectable, UnprocessableEntityException } from '@nestjs/common';
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

@Injectable()
export class AssistantService {
  constructor(private readonly products: ProductsService) {}

  async chat(messages: AssistantMessageDto[]) {
    const lastMessage = messages.at(-1);
    if (lastMessage?.role !== 'user') {
      throw new UnprocessableEntityException('The last chat message must be from the customer.');
    }

    const query = lastMessage.content.trim();
    const budget = extractBudget(query);
    const products = await this.products.searchForAssistant(query, null, budget);

    if (!products.length) {
      return {
        reply: `I couldn't find an in-stock match for “${query}”. Try a product name or category, such as pet care, home health, or a thermometer.`,
        products: [],
        source: 'live_catalog',
      };
    }

    const budgetNote = budget === null ? '' : ` within Rs. ${budget.toLocaleString('en-PK')}`;
    return {
      reply: `I found these in-stock catalogue matches${budgetNote}. You can compare the listed prices and add any item to your cart.`,
      products,
      source: 'live_catalog',
    };
  }
}
