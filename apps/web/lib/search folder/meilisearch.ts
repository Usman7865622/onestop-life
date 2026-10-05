// lib/search/meilisearch.ts
import { MeiliSearch } from 'meilisearch';

export const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY || 'masterKey',
});

export const PRODUCTS_INDEX = 'products';

/**
 * Common Urdu & Roman Urdu e-commerce synonyms dictionary
 */
export const ROMAN_URDU_SYNONYMS: Record<string, string[]> = {
  chawal: ['rice', 'چاول'],
  rice: ['chawal', 'چاول'],
  cheeni: ['sugar', 'چینی'],
  sugar: ['cheeni', 'چینی'],
  aata: ['flour', 'wheat flour', 'آٹا'],
  ghee: ['oil', 'cooking oil', 'گھی'],
  doodh: ['milk', 'دودھ'],
  chai: ['tea', 'پتی', 'چائے'],
  sabun: ['soap', 'صابن'],
  mobile: ['phone', 'smartphone', 'موبائل'],
  jootay: ['shoes', 'جوتے'],
  kapray: ['clothes', 'کپڑے'],
};

/**
 * Initializes index settings, search attributes, facets, and synonyms.
 */
export async function initializeMeilisearchIndices() {
  const index = meiliClient.index(PRODUCTS_INDEX);

  await index.updateSettings({
    searchableAttributes: [
      'nameEn',
      'nameUr',
      'brandName',
      'categoryPath',
      'sku',
      'attributesText',
    ],
    filterableAttributes: [
      'categoryId',
      'brandId',
      'priceMinor',
      'inStock',
      'attributes',
      'regulation',
    ],
    sortableAttributes: [
      'priceMinor',
      'createdAt',
      'popularityScore',
    ],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
      'inStock:desc',
      'popularityScore:desc',
    ],
    synonyms: ROMAN_URDU_SYNONYMS,
  });

  console.log('Meilisearch products index initialized successfully.');
}