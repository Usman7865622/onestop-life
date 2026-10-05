import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from '../../prisma/prisma.service';

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
      take: 100,
    });

    const terms = query.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 1);
    const ranked = products
      .map((product) => {
        const text = `${product.nameEn} ${product.nameUr ?? ''} ${product.category ?? ''}`.toLocaleLowerCase();
        const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
        return { product, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return ranked.slice(0, 8).map(({ product }) => product);
  }

  listMine(sellerId: string) {
    return this.prisma.product.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' } });
  }

  create(sellerId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, sellerId, inStock: dto.inStock ?? true } });
  }
}
