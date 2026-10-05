'use client';

import { FormEvent, useState } from 'react';
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
  onAddToCart: (product: AssistantProduct) => void;
};

function money(priceMinor: number) {
  return `Rs. ${(priceMinor / 100).toFixed(2)}`;
}

export default function ShopAssistant({ onAddToCart }: ShopAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
      const payload = await response.json() as { reply?: string; products?: AssistantProduct[]; message?: string };
      if (!response.ok) throw new Error(payload.message || 'The assistant could not answer right now.');
      setMessages((current) => [...current, {
        role: 'assistant' as const,
        content: payload.reply || 'I could not find a matching product. Try another description.',
        products: payload.products ?? [],
      }].slice(-12));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not answer right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="OneStop shopping assistant">
          <header className={styles.header}>
            <div className={styles.avatar} aria-hidden="true">O</div>
            <div><strong>OneStop assistant</strong><span>Product discovery, grounded in our catalogue</span></div>
            <button className={styles.close} type="button" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </header>
          <div className={styles.transcript} aria-live="polite">
            {!messages.length ? (
              <div className={styles.welcome}>
                <strong>What are you looking for?</strong>
                <p>Tell me what you need, your budget, or a category and I’ll look through the catalogue.</p>
                <div className={styles.suggestions}>
                  <button type="button" onClick={() => void sendMessage(undefined, 'Show me home health products')}>Home health picks</button>
                  <button type="button" onClick={() => void sendMessage(undefined, 'Find something for pet care')}>Pet care</button>
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
                        <button type="button" onClick={() => { onAddToCart(product); setNotice(`${product.nameEn} added to your cart.`); }}>Add</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {busy ? <div className={styles.thinking} role="status">Looking through the catalogue…</div> : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
          </div>
          <form className={styles.composer} onSubmit={(event) => void sendMessage(event)}>
            <label className={styles.visuallyHidden} htmlFor="assistant-message">Ask about products</label>
            <input id="assistant-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1200} placeholder="Describe what you need…" disabled={busy} />
            <button type="submit" disabled={busy || !draft.trim()}>Send</button>
          </form>
          <p className={styles.disclaimer}>Product suggestions are not medical advice. Ask a qualified professional about health decisions.</p>
        </section>
      ) : null}
      <button className={styles.launcher} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span aria-hidden="true">✦</span> Ask OneStop
      </button>
    </div>
  );
}
