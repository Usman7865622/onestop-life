'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import styles from './shop-assistant.module.css';

export type AssistantProduct = {
  id: string;
  nameEn: string;
  nameUr: string | null;
  priceMinor: number;
  unit: string;
  category: string | null;
  imageUrl: string | null;
  inStock: boolean;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  products?: AssistantProduct[];
};

type ShopAssistantProps = {
  catalogProducts: AssistantProduct[];
  onAddToCart: (product: AssistantProduct) => void;
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'for', 'from', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or',
  'please', 'product', 'products', 'show', 'some', 'something', 'the', 'to', 'want', 'with',
  'looking', 'need', 'find', 'under', 'below', 'less', 'than', 'price', 'budget', 'rs', 'pkr',
  'rupees', 'cheap', 'cheaper', 'affordable', 'best', 'good', 'recommend', 'what', 'which',
]);

const TOPIC_GROUPS = [
  { terms: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'vet', 'veterinary', 'puppy', 'kitten'], categories: ['pet care'] },
  { terms: ['baby', 'babies', 'infant', 'newborn', 'diaper', 'nappy'], categories: ['baby care'] },
  { terms: ['medicine', 'medicines', 'medication', 'pill', 'pills', 'tablet', 'tablets', 'syrup'], categories: ['medicines'] },
  { terms: ['vitamin', 'vitamins', 'supplement', 'supplements', 'protein', 'nutrition', 'omega'], categories: ['wellness', 'nutrition'] },
  { terms: ['skin', 'lotion', 'sunscreen', 'soap', 'wash'], categories: ['personal care'] },
  { terms: ['electronics', 'electronic', 'appliance', 'appliances', 'smart', 'watch', 'blender', 'purifier'], categories: ['electronics appliances'] },
  { terms: ['home', 'firstaid', 'prepared', 'safety', 'ice'], categories: ['home health', 'health essentials'] },
  { terms: ['thermometer', 'temperature', 'oximeter', 'nebulizer', 'glucometer', 'glucose', 'monitor', 'pressure', 'medical', 'device', 'devices'], categories: ['medical devices'] },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function getBudget(query: string) {
  const match = query.match(/\b(?:under|below|less than|max(?:imum)?|within|budget(?: of)?)\s*(?:(?:rs\.?|pkr|rupees)\s*)?([\d,]+(?:\.\d+)?)/i)
    ?? query.match(/\b(?:rs\.?|pkr|rupees)\s*([\d,]+(?:\.\d+)?)/i);
  return match?.[1] ? Number(match[1].replaceAll(',', '')) : null;
}

function rankProducts(query: string, products: AssistantProduct[]) {
  const normalizedQuery = normalize(query);
  const terms = [...new Set(normalizedQuery
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1 && !/^\d+(?:\.\d+)?$/.test(term) && !STOP_WORDS.has(term)))];
  if (!terms.length) return [];

  const budget = getBudget(query);
  const groups = TOPIC_GROUPS.filter((group) => group.terms.some((term) => terms.includes(term)));

  return products
    .filter((product) => product.inStock && (budget === null || product.priceMinor <= budget * 100))
    .map((product) => {
      const name = normalize(`${product.nameEn} ${product.nameUr ?? ''}`);
      const category = normalize(product.category ?? '');
      let score = terms.reduce((total, term) => {
        if (name.includes(term)) return total + 4;
        if (category.includes(term)) return total + 3;
        return total;
      }, 0);
      for (const group of groups) {
        if (group.categories.some((item) => category.includes(item))) score += 6;
      }
      const phrase = terms.join(' ');
      if (phrase.length > 3 && `${name} ${category}`.includes(phrase)) score += 5;
      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.product.priceMinor - b.product.priceMinor)
    .slice(0, 4)
    .map(({ product }) => product);
}

function money(priceMinor: number) {
  return `Rs. ${(priceMinor / 100).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ShopAssistant({ catalogProducts, onAddToCart }: ShopAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const transcriptRef = useRef<HTMLDivElement>(null);

  const inStockProducts = useMemo(() => catalogProducts.filter((product) => product.inStock), [catalogProducts]);
  const liveSuggestions = useMemo(() => rankProducts(draft, catalogProducts), [draft, catalogProducts]);
  const categorySuggestions = useMemo(
    () => [...new Set(inStockProducts.map((product) => product.category).filter((category): category is string => Boolean(category)))].slice(0, 4),
    [inStockProducts],
  );

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages, busy, liveSuggestions.length, error, notice]);

  const sendMessage = async (event?: FormEvent<HTMLFormElement>, suggestion?: string) => {
    event?.preventDefault();
    const content = (suggestion ?? draft).trim();
    if (!content || busy) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user' as const, content }].slice(-12);
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setNotice('');
    setBusy(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })) }),
      });
      const payload = await response.json().catch(() => ({})) as { reply?: string; products?: AssistantProduct[]; message?: string };
      if (!response.ok) throw new Error(payload.message || 'The catalogue assistant could not answer right now.');
      setMessages((current) => [...current, {
        role: 'assistant' as const,
        content: payload.reply || 'I could not find an in-stock match. Try a product name or category.',
        products: payload.products ?? [],
      }].slice(-12));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The catalogue assistant could not answer right now.');
    } finally {
      setBusy(false);
    }
  };

  const addProduct = (product: AssistantProduct) => {
    onAddToCart(product);
    setNotice(`${product.nameEn} added to your cart.`);
  };

  const clearConversation = () => {
    setMessages([]);
    setDraft('');
    setError('');
    setNotice('');
  };

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="OneStop live product assistant">
          <header className={styles.header}>
            <div className={styles.avatar} aria-hidden="true">OS</div>
            <div className={styles.headerCopy}>
              <strong>OneStop assistant</strong>
              <span><i className={styles.onlineDot} /> Live catalogue · {inStockProducts.length} in-stock products</span>
            </div>
            {messages.length ? <button className={styles.headerAction} type="button" onClick={clearConversation} aria-label="Start a new conversation" title="New conversation">↻</button> : null}
            <button className={styles.close} type="button" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </header>

          <div className={styles.transcript} ref={transcriptRef} aria-live="polite">
            {!messages.length ? (
              <div className={styles.welcome}>
                <span className={styles.welcomeEyebrow}>YOUR LIVE SHOPPING GUIDE</span>
                <strong>What can I help you find?</strong>
                <p>Describe an item, who it is for, or your budget. I’ll match it against products currently in stock.</p>
                <div className={styles.suggestions} aria-label="Browse a category">
                  {categorySuggestions.map((category) => (
                    <button key={category} type="button" onClick={() => void sendMessage(undefined, `Show me ${category} products`)}>
                      {category}<span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.map((message, index) => (
              <article className={message.role === 'user' ? styles.userMessage : styles.assistantMessage} key={`${index}-${message.role}`}>
                <p>{message.content}</p>
                {message.products?.length ? (
                  <div className={styles.productList}>
                    {message.products.map((product) => (
                      <div className={styles.productCard} key={product.id}>
                        {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <div className={styles.productPlaceholder} aria-hidden="true">✦</div>}
                        <div className={styles.productInfo}>
                          <span>{product.category || 'OneStop product'}</span>
                          <strong>{product.nameEn}</strong>
                          <small>{money(product.priceMinor)} / {product.unit}</small>
                        </div>
                        <button type="button" onClick={() => addProduct(product)}>Add</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {busy ? <div className={styles.thinking} role="status"><span className={styles.typingDots}><i /><i /><i /></span> Checking live stock and prices…</div> : null}

            {draft.trim().length >= 2 ? (
              <section className={styles.liveSuggestions} aria-label="Live product suggestions">
                <div className={styles.suggestionHeading}>
                  <span>LIVE MATCHES</span>
                  <small>{liveSuggestions.length ? `${liveSuggestions.length} in-stock suggestions` : 'Keep typing or try a category'}</small>
                </div>
                {liveSuggestions.length ? liveSuggestions.map((product) => (
                  <div className={styles.liveSuggestion} key={product.id}>
                    <button className={styles.suggestionProduct} type="button" onClick={() => void sendMessage(undefined, `Tell me about ${product.nameEn}`)}>
                      {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className={styles.productPlaceholder} aria-hidden="true">✦</span>}
                      <span className={styles.suggestionDetails}><small>{product.category ?? 'OneStop product'}</small><strong>{product.nameEn}</strong></span>
                      <b>{money(product.priceMinor)}</b>
                    </button>
                    <button className={styles.quickAdd} type="button" onClick={() => addProduct(product)} aria-label={`Add ${product.nameEn} to cart`}>+</button>
                  </div>
                )) : <p className={styles.noMatches}>No close matches yet. Try “pet care”, “vitamins”, or “thermometer”.</p>}
              </section>
            ) : null}

            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
          </div>

          <form className={styles.composer} onSubmit={(event) => void sendMessage(event)}>
            <label className={styles.visuallyHidden} htmlFor="assistant-message">Search or ask about products</label>
            <input
              id="assistant-message"
              value={draft}
              onChange={(event) => { setDraft(event.target.value); setError(''); setNotice(''); }}
              maxLength={1200}
              placeholder="Try “pet shampoo under Rs 1,500”"
              disabled={busy}
              autoComplete="off"
            />
            <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message">{busy ? '…' : '↑'}</button>
          </form>
          <p className={styles.disclaimer}>Catalog details reflect current listings. Product suggestions are not medical advice.</p>
        </section>
      ) : null}
      <button className={styles.launcher} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className={styles.launcherIcon} aria-hidden="true">✦</span><span>Ask OneStop</span><i className={styles.onlineDot} aria-hidden="true" />
      </button>
    </div>
  );
}
