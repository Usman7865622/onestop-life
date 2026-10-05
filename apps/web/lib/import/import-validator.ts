// lib/import/import-validator.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface RawCsvRow {
  sku: string;
  nameEn: string;
  nameUr: string;
  descEn?: string;
  descUr?: string;
  categorySlug: string;
  brandSlug?: string;
  sellerId: string;
  priceMinor: string | number; // in paisa
  compareAtMinor?: string | number;
  barcode?: string;
  weightGrams?: string | number;
  unit: string;
  regulation?: string;
  attributes?: string; // JSON string e.g. {"ram": "16GB", "storage": "512GB"}
  options?: string;    // JSON string e.g. {"packSize": "1kg"}
  initialStock?: string | number;
}

export interface RowValidationResult {
  rowNumber: number;
  sku: string | null;
  isValid: boolean;
  action: 'CREATE' | 'UPDATE' | 'REJECT';
  errors: string[];
  parsedData?: any;
}

/**
 * Validates GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13), and GTIN-14 check digits.
 */
export function isValidBarcode(barcode: string): boolean {
  const clean = barcode.trim();
  if (!/^\d{8}$\vert{}^\d{12,14}$/.test(clean)) return false;

  const digits = clean.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  // Calculate checksum from right to left
  let sum = 0;
  let multiplier = 3;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * multiplier;
    multiplier = multiplier === 3 ? 1 : 3;
  }
  
  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

/**
 * Validates dynamic attributes against CategoryAttribute definitions.
 */
function validateAttributes(
  attributes: Record<string, any>,
  definitions: Array<{ key: string; type: string; required: boolean; choices: any }>
): string[] {
  const errors: string[] = [];

  for (const def of definitions) {
    const value = attributes[def.key];

    if (def.required && (value === undefined || value === null || value === '')) {
      errors.push(`Attribute '${def.key}' is required.`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (def.type === 'number' && typeof value !== 'number' && isNaN(Number(value))) {
        errors.push(`Attribute '${def.key}' must be numeric.`);
      }

      if (def.type === 'choice' && Array.isArray(def.choices)) {
        if (!def.choices.includes(value)) {
          errors.push(`Attribute '${def.key}' has invalid choice '${value}'. Allowed: ${def.choices.join(', ')}.`);
        }
      }
    }
  }

  return errors;
}

/**
 * Dry-Run validation over raw uploaded rows.
 */
export async function validateImportBatch(
  jobId: string,
  rawRows: RawCsvRow[]
): Promise<{ toCreate: number; toUpdate: number; rejected: number }> {
  const seenSkusInFile = new Set<string>();
  const validationResults: RowValidationResult[] = [];

  // Pre-load reference maps to avoid N+1 queries during validation
  const categories = await prisma.category.findMany({
    include: { attributes: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  const brands = await prisma.brand.findMany();
  const brandMap = new Map(brands.map((b) => [b.slug, b.id]));

  const allSkus = rawRows.map((r) => r.sku?.trim()).filter(Boolean);
  const existingVariants = await prisma.productVariant.findMany({
    where: { sku: { in: allSkus } },
    select: { sku: true, id: true, productId: true },
  });
  const existingSkuMap = new Map(existingVariants.map((v) => [v.sku, v]));

  let toCreate = 0;
  let toUpdate = 0;
  let rejected = 0;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const rowNumber = idx + 1;
    const errors: string[] = [];
    const sku = row.sku ? row.sku.trim() : null;

    if (!sku) {
      errors.push('SKU is required.');
    } else if (seenSkusInFile.has(sku)) {
      errors.push(`Duplicate SKU '${sku}' found in upload file.`);
    } else {
      seenSkusInFile.add(sku);
    }

    if (!row.nameEn?.trim()) errors.push('English product name (nameEn) is required.');
    if (!row.nameUr?.trim()) errors.push('Urdu product name (nameUr) is required.');
    if (!row.sellerId?.trim()) errors.push('sellerId is required.');
    if (!row.unit?.trim()) errors.push('Unit is required.');

    const priceMinor = parseInt(String(row.priceMinor), 10);
    if (isNaN(priceMinor) || priceMinor < 0) {
      errors.push('priceMinor must be a non-negative integer (paisa).');
    }

    if (row.barcode && !isValidBarcode(row.barcode)) {
      errors.push(`Invalid barcode checksum or format: ${row.barcode}`);
    }

    const category = categoryMap.get(row.categorySlug?.trim());
    if (!category) {
      errors.push(`Category slug '${row.categorySlug}' not found.`);
    }

    let parsedAttributes: Record<string, any> = {};
    if (row.attributes) {
      try {
        parsedAttributes = typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes;
      } catch {
        errors.push('Invalid JSON format in attributes field.');
      }
    }

    if (category && category.attributes.length > 0) {
      const attrErrors = validateAttributes(parsedAttributes, category.attributes);
      errors.push(...attrErrors);
    }

    let parsedOptions: Record<string, any> = {};
    if (row.options) {
      try {
        parsedOptions = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
      } catch {
        errors.push('Invalid JSON format in options field.');
      }
    }

    const isValid = errors.length === 0;
    let action: 'CREATE' | 'UPDATE' | 'REJECT' = 'REJECT';

    if (isValid) {
      action = existingSkuMap.has(sku!) ? 'UPDATE' : 'CREATE';
      if (action === 'CREATE') toCreate++;
      else toUpdate++;
    } else {
      rejected++;
    }

    validationResults.push({
      rowNumber,
      sku,
      isValid,
      action,
      errors,
      parsedData: isValid
        ? {
            sku: sku!,
            nameEn: row.nameEn.trim(),
            nameUr: row.nameUr.trim(),
            descEn: row.descEn?.trim(),
            descUr: row.descUr?.trim(),
            categoryId: category!.id,
            brandId: row.brandSlug ? brandMap.get(row.brandSlug.trim()) || null : null,
            sellerId: row.sellerId.trim(),
            priceMinor,
            compareAtMinor: row.compareAtMinor ? parseInt(String(row.compareAtMinor), 10) : null,
            barcode: row.barcode ? row.barcode.trim() : null,
            weightGrams: row.weightGrams ? parseInt(String(row.weightGrams), 10) : null,
            unit: row.unit.trim(),
            regulation: row.regulation || 'none',
            attributes: parsedAttributes,
            options: parsedOptions,
            initialStock: row.initialStock ? Math.max(0, parseInt(String(row.initialStock), 10)) : 0,
          }
        : null,
    });
  }

  // Persist dry-run results to database
  await prisma.$transaction(async (tx) => {
    await tx.importRow.deleteMany({ where: { jobId } });

    await tx.importRow.createMany({
      data: validationResults.map((vr) => ({
        jobId,
        rowNumber: vr.rowNumber,
        sku: vr.sku,
        isValid: vr.isValid,
        action: vr.action,
        rawPayload: vr.parsedData || (rawRows[vr.rowNumber - 1] as unknown as Prisma.InputJsonValue),
        errors: vr.errors.length > 0 ? vr.errors : Prisma.JsonNull,
      })),
    });

    await tx.importJob.update({
      where: { id: jobId },
      data: {
        status: 'VALIDATED',
        totalRows: rawRows.length,
        validRows: toCreate + toUpdate,
        invalidRows: rejected,
        summary: { toCreate, toUpdate, rejected },
      },
    });
  });

  return { toCreate, toUpdate, rejected };
}

/**
 * Apply validated rows to database in atomic batches and queue outbox search events.
 */
export async function applyImportJob(jobId: string): Promise<void> {
  const job = await prisma.importJob.findUnique({
    where: { id: jobId },
    include: {
      rows: {
        where: { isValid: true },
        orderBy: { rowNumber: 'asc' },
      },
    },
  });

  if (!job || job.status !== 'VALIDATED') {
    throw new Error('Import job must be in VALIDATED state to be applied.');
  }

  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: 'APPLYING' },
  });

  const BATCH_SIZE = 100;
  for (let i = 0; i < job.rows.length; i += BATCH_SIZE) {
    const chunk = job.rows.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(async (tx) => {
      for (const row of chunk) {
        const item = row.rawPayload as any;

        // Upsert Product root
        const product = await tx.product.create({
          data: {
            sellerId: item.sellerId,
            categoryId: item.categoryId,
            brandId: item.brandId,
            nameEn: item.nameEn,
            nameUr: item.nameUr,
            descEn: item.descEn,
            descUr: item.descUr,
            attributes: item.attributes,
            regulation: item.regulation,
            status: 'active',
            unit: item.unit,
          },
        });

        // Upsert Variant
        const variant = await tx.productVariant.upsert({
          where: { sku: item.sku },
          create: {
            productId: product.id,
            sku: item.sku,
            options: item.options,
            priceMinor: item.priceMinor,
            compareAtMinor: item.compareAtMinor,
            barcode: item.barcode,
            weightGrams: item.weightGrams,
          },
          update: {
            options: item.options,
            priceMinor: item.priceMinor,
            compareAtMinor: item.compareAtMinor,
            barcode: item.barcode,
            weightGrams: item.weightGrams,
          },
        });

        // Manage Inventory and initial ledger entry
        const inventory = await tx.inventoryItem.upsert({
          where: { variantId: variant.id },
          create: {
            variantId: variant.id,
            onHand: item.initialStock || 0,
            reserved: 0,
          },
          update: {
            onHand: { increment: item.initialStock || 0 },
          },
        });

        if (item.initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              quantity: item.initialStock,
              reason: 'import_init',
              responsiblePerson: 'system_import',
            },
          });
        }

        // Write to Outbox within same transaction
        await tx.outboxEvent.create({
          data: {
            aggregate: 'PRODUCT',
            aggregateId: product.id,
            eventType: 'UPSERT',
            payload: {
              productId: product.id,
              variantId: variant.id,
              sku: variant.sku,
              nameEn: product.nameEn,
              nameUr: product.nameUr,
              categoryId: product.categoryId,
              brandId: product.brandId,
              priceMinor: variant.priceMinor,
              attributes: product.attributes,
              onHand: inventory.onHand,
              reserved: inventory.reserved,
            },
          },
        });
      }
    });
  }

  await prisma.importJob.update({
    where: { id: jobId },
    data: { status: 'COMPLETED' },
  });
}