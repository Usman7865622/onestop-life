import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from '../../prisma/prisma.service';

const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'for', 'from', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or',
  'please', 'product', 'products', 'show', 'some', 'something', 'the', 'to', 'want', 'with',
  'looking', 'need', 'find', 'under', 'below', 'less', 'than', 'price', 'budget', 'rs', 'pkr',
  'rupees', 'cheap', 'cheaper', 'affordable', 'best', 'good', 'recommend',
]);

const SEARCH_GROUPS = [
  { triggers: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'vet', 'veterinary', 'puppy', 'kitten'], categories: ['pet care'] },
  { triggers: ['baby', 'babies', 'infant', 'newborn', 'diaper', 'nappy'], categories: ['baby care'] },
  { triggers: ['medicine', 'medicines', 'medication', 'pill', 'pills', 'tablet', 'tablets', 'syrup', 'pharmacy'], categories: ['medicines'] },
  { triggers: ['vitamin', 'vitamins', 'supplement', 'supplements', 'protein', 'nutrition', 'omega'], categories: ['wellness', 'nutrition'] },
  { triggers: ['skin', 'lotion', 'sunscreen', 'soap', 'wash', 'personal'], categories: ['personal care'] },
  { triggers: ['electronics', 'electronic', 'appliance', 'appliances', 'smart', 'watch', 'blender', 'purifier'], categories: ['electronics appliances'] },
  { triggers: ['home', 'firstaid', 'prepared', 'safety', 'ice'], categories: ['home health', 'health essentials'] },
  { triggers: ['thermometer', 'temperature', 'oximeter', 'nebulizer', 'glucometer', 'glucose', 'monitor', 'pressure', 'medical', 'device', 'devices'], categories: ['medical devices'] },
];

function normalizeSearchText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return { items };
  }

  async searchForAssistant(query: string, category: string | null, maxPricePkr: number | null) {
    const products = await this.prisma.product.findMany({
      where: {
        inStock: true,
        ...(category ? { category: { contains: category, mode: 'insensitive' as const } } : {}),
        ...(maxPricePkr !== null ? { priceMinor: { lte: Math.floor(maxPricePkr * 100) } } : {}),
      },
      select: {
        id: true,
        nameEn: true,
        nameUr: true,
        priceMinor: true,
        unit: true,
        category: true,
        imageUrl: true,
        inStock: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    });

    const normalizedQuery = normalizeSearchText(query);
    const terms = [...new Set(normalizedQuery
      .split(/[^\p{L}\p{N}]+/u)
      .filter((term) => term.length > 1 && !/^\d+(?:\.\d+)?$/.test(term) && !SEARCH_STOP_WORDS.has(term)))];
    const activeGroups = SEARCH_GROUPS.filter((group) => group.triggers.some((term) => terms.includes(term)));
    const ranked = products
      .map((product) => {
        const name = normalizeSearchText(`${product.nameEn} ${product.nameUr ?? ''}`);
        const normalizedCategory = normalizeSearchText(product.category ?? '');
        const text = `${name} ${normalizedCategory}`;
        let score = terms.reduce((total, term) => {
          if (name.includes(term)) return total + 4;
          if (normalizedCategory.includes(term)) return total + 3;
          return total;
        }, 0);

        for (const group of activeGroups) {
          if (group.categories.some((item) => normalizedCategory.includes(item))) score += 6;
        }

        const phrase = terms.join(' ');
        if (phrase.length > 3 && text.includes(phrase)) score += 5;
        return { product, score };
      })
      .filter(({ score }) => score > 0 || (!terms.length && maxPricePkr !== null))
      .sort((a, b) => b.score - a.score || a.product.priceMinor - b.product.priceMinor);

    return ranked.slice(0, 6).map(({ product }) => product);
  }

  listMine(sellerId: string) {
    return this.prisma.product.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } });
  }

  create(sellerId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, sellerId, inStock: dto.inStock ?? true } });
  }
}
