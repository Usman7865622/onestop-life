import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    try {
      const count = await this.product.count();
      if (count === 0) {
        const starterProducts = [
          { nameEn: 'Paracetamol 500mg', priceMinor: 12000, unit: 'pack', category: 'Medicines', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Cough Relief Syrup', priceMinor: 28000, unit: 'bottle', category: 'Medicines', imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446ade?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Antiseptic Cream', priceMinor: 18000, unit: 'tube', category: 'Medicines', imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Digital Thermometer', priceMinor: 85000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Blood Pressure Monitor', priceMinor: 285000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Vitamin C Tablets', priceMinor: 45000, unit: 'bottle', category: 'Wellness', imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8ca1?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'First Aid Kit', priceMinor: 125000, unit: 'kit', category: 'Health essentials', imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446ade?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Moisturizing Lotion', priceMinor: 65000, unit: 'bottle', category: 'Personal care', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Baby Gentle Wash', priceMinor: 72000, unit: 'bottle', category: 'Baby care', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Organic Honey', priceMinor: 95000, unit: 'jar', category: 'Nutrition', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Pet Care Shampoo', priceMinor: 88000, unit: 'bottle', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Reusable Face Masks', priceMinor: 35000, unit: 'pack', category: 'Health essentials', imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Pulse Oximeter', priceMinor: 220000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Digital Glucometer Kit', priceMinor: 195000, unit: 'kit', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Portable Nebulizer', priceMinor: 420000, unit: 'item', category: 'Medical devices', imageUrl: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Electric Heating Pad', priceMinor: 275000, unit: 'item', category: 'Home health', imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Surgical Gloves', priceMinor: 55000, unit: 'box', category: 'Health essentials', imageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Antibacterial Hand Wash', priceMinor: 39000, unit: 'bottle', category: 'Personal care', imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Sunscreen SPF 50', priceMinor: 125000, unit: 'tube', category: 'Personal care', imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Baby Diaper Pack', priceMinor: 185000, unit: 'pack', category: 'Baby care', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Baby Moisturizing Cream', priceMinor: 98000, unit: 'jar', category: 'Baby care', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Electrolyte Drink Mix', priceMinor: 75000, unit: 'box', category: 'Nutrition', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Protein Nutrition Powder', priceMinor: 285000, unit: 'tub', category: 'Nutrition', imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Omega 3 Softgels', priceMinor: 160000, unit: 'bottle', category: 'Wellness', imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Herbal Sleep Tea', priceMinor: 68000, unit: 'box', category: 'Wellness', imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Flea & Tick Pet Shampoo', priceMinor: 115000, unit: 'bottle', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Pet Joint Support Chews', priceMinor: 145000, unit: 'pack', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Pet Dental Care Kit', priceMinor: 92000, unit: 'kit', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Cat Litter Tray', priceMinor: 240000, unit: 'item', category: 'Pet care', imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Reusable Ice Pack', priceMinor: 85000, unit: 'item', category: 'Home health', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Medicine Organizer Box', priceMinor: 110000, unit: 'item', category: 'Home health', imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Smart Health Watch', priceMinor: 649000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Digital Body Scale', priceMinor: 385000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Compact Air Purifier', priceMinor: 1290000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Portable USB Blender', priceMinor: 295000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80' },
          { nameEn: 'Rechargeable Neck Massager', priceMinor: 520000, unit: 'item', category: 'Electronics & appliances', imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=900&q=80' },
        ];
        for (const item of starterProducts) {
          await this.product.create({ data: item });
        }
      }
    } catch (err) {
      console.warn('Initial product auto-seed skipped or failed:', err);
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
