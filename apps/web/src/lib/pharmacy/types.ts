export type Medicine = {
  id: string;
  nameEn: string;
  nameUr?: string | null;
  priceMinor: number;
  unit: string;
  category?: string | null;
  imageUrl?: string | null;
  inStock: boolean;
  genericName?: string | null;
  brandName?: string | null;
  strength?: string | null;
  form?: string | null;
  therapeuticClass?: string | null;
  requiresRx: boolean;
  packSize?: string | null;
};

export type MedicineClass = {
  name: string;
  count: number;
};
