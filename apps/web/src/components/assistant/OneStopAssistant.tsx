'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import DoctorAvatar from '../doctors/DoctorAvatar';
import styles from './assistant.module.css';

export type AssistantCard = {
  type: 'doctor' | 'medicine' | 'lab' | 'facility' | 'product';
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  priceMinor?: number;
  badge?: string;
  href: string;
  imageUrl?: string;
  avatarName?: string;
};

type LegacyProduct = {
  id?: string;
  nameEn: string;
  category: string | null;
  priceMinor: number;
  unit: string;
  imageUrl?: string | null;
};

type AssistantResponse = {
  reply?: string;
  products?: LegacyProduct[];
  cards?: AssistantCard[];
  suggestions?: string[];
  message?: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: AssistantCard[];
  suggestions?: string[];
  createdAt: number;
};

const STORAGE_KEY = 'onestop-assistant-chat';
const MAX_STORED_MESSAGES = 30;
const QUICK_ACTIONS = [
  'Find a cardiologist in Lahore',
  'I need paracetamol',
  'Book a CBC test',
  'Blood needed urgently',
  'Trending products',
];

const CARD_LABELS: Record<AssistantCard['type'], string> = {
  doctor: 'Doctor',
  medicine: 'Medicine',
  lab: 'Lab test',
  facility: 'Facility',
  product: 'Product',
};

const CARD_ACTIONS: Record<AssistantCard['type'], string> = {
  doctor: 'Book',
  medicine: 'View',
  lab: 'Book test',
  facility: 'View',
  product: 'View',
};

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function money(priceMinor: number) {
  const rupees = priceMinor / 100;
  return `Rs. ${rupees.toLocaleString('en-PK', {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  })}`;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function isStoredMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<ChatMessage>;
  return typeof message.id === 'string'
    && (message.role === 'user' || message.role === 'assistant')
    && typeof message.content === 'string'
    && typeof message.createdAt === 'number';
}

function legacyCards(products: LegacyProduct[] = []): AssistantCard[] {
  return products.slice(0, 4).map((product, index) => ({
    type: 'product',
    id: product.id ?? `legacy-product-${index}`,
    title: product.nameEn,
    subtitle: product.category ?? 'OneStop product',
    meta: `Sold by ${product.unit}`,
    priceMinor: product.priceMinor,
    badge: 'In stock',
    href: `/products?q=${encodeURIComponent(product.nameEn)}`,
    imageUrl: product.imageUrl ?? undefined,
  }));
}

function BotAvatar({ compact = false }: { compact?: boolean }) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `onestop-assistant-gradient-${reactId}`;

  return (
    <svg
      className={compact ? styles.botAvatarCompact : styles.botAvatar}
      viewBox="0 0 48 48"
      role="img"
      aria-label="OneStop Assistant"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#20b2aa" />
          <stop offset="0.55" stopColor="#166a91" />
          <stop offset="1" stopColor="#17365d" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="14" fill={`url(#${gradientId})`} />
      <path d="M24 7v5" stroke="#f7b928" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="7" r="2.2" fill="#f7b928" />
      <rect x="11" y="13" width="26" height="21" rx="9" fill="#ffffff" />
      <circle cx="19" cy="22" r="2.1" fill="#166a91" />
      <circle cx="29" cy="22" r="2.1" fill="#166a91" />
      <path d="M19 28c1.5 1.5 3.2 2.2 5 2.2s3.5-.7 5-2.2" fill="none" stroke="#166a91" strokeWidth="2" strokeLinecap="round" />
      <path d="M36.5 31.5h4M38.5 29.5v4" stroke="#147a3d" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 36c3-2.3 7.8-3.5 14-3.5S35 33.7 38 36" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CardVisual({ card }: { card: AssistantCard }) {
  if (card.type === 'doctor') {
    return <DoctorAvatar name={card.avatarName ?? card.title} size={54} className={styles.doctorAvatar} />;
  }

  if (card.type === 'product' && card.imageUrl) {
    return <img className={styles.cardImage} src={card.imageUrl} alt="" loading="lazy" />;
  }

  const symbol = card.type === 'medicine'
    ? 'Rx'
    : card.type === 'lab'
      ? '◉'
      : card.type === 'facility'
        ? '+'
        : '✦';

  return (
    <div className={`${styles.cardIcon} ${styles[`cardIcon_${card.type}`]}`} aria-hidden="true">
      {symbol}
    </div>
  );
}

function AssistantCardView({ card }: { card: AssistantCard }) {
  const isRx = card.type === 'medicine' && card.badge === 'Rx required';

  return (
    <article className={styles.card}>
      <CardVisual card={card} />
      <div className={styles.cardBody}>
        <div className={styles.cardTopLine}>
          <span>{CARD_LABELS[card.type]}</span>
          {card.badge ? (
            <span className={isRx ? styles.badgeRx : styles.badge}>{card.badge}</span>
          ) : null}
        </div>
        <strong>{card.title}</strong>
        {card.subtitle ? <p>{card.subtitle}</p> : null}
        {card.meta ? <small>{card.meta}</small> : null}
        <div className={styles.cardFooter}>
          {typeof card.priceMinor === 'number' ? <b>{money(card.priceMinor)}</b> : <span />}
          <Link href={card.href} className={styles.cardAction}>
            {CARD_ACTIONS[card.type]} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function OneStopAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastFailedPrompt, setLastFailedPrompt] = useState('');
  const [hasUnread, setHasUnread] = useState(true);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          setMessages(parsed.filter(isStoredMessage).slice(-MAX_STORED_MESSAGES));
        }
      }
    } catch {
      // Storage can be unavailable in private or embedded contexts; chat still works for this session.
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
      // Ignore storage quota and privacy-mode failures.
    }
  }, [messages, storageLoaded]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages, busy, error, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open ]);

  const requestAssistant = async (history: ChatMessage[]) => {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history.slice(-12).map(({ role, content }) => ({ role, content })),
      }),
    });
    const payload = await response.json().catch(() => ({})) as AssistantResponse;
    if (!response.ok) {
      throw new Error(payload.message || 'OneStop Assistant could not answer right now. Please try again.');
    }

    const cards = payload.cards?.length ? payload.cards : legacyCards(payload.products);
    return {
      id: makeId(),
      role: 'assistant' as const,
      content: payload.reply?.trim() || 'Here is what I found on OneStop Life.',
      cards,
      suggestions: payload.suggestions ?? [],
      createdAt: Date.now(),
    } satisfies ChatMessage;
  };

  const sendMessage = async (rawContent: string, appendUser = true) => {
    const content = rawContent.trim();
    if (!content || busy) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    const history = (appendUser ? [...messages, userMessage] : messages).slice(-MAX_STORED_MESSAGES);
    if (appendUser) {
      setMessages(history);
      setDraft('');
    }
    setError('');
    setLastFailedPrompt('');
    setBusy(true);

    try {
      const assistantMessage = await requestAssistant(history);
      setMessages([...history, assistantMessage].slice(-MAX_STORED_MESSAGES));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'OneStop Assistant could not answer right now. Please try again.');
      setLastFailedPrompt(content);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  const retryLast = () => {
    if (!lastFailedPrompt || busy) return;
    void sendMessage(lastFailedPrompt, false);
  };

  const clearConversation = () => {
    setMessages([]);
    setDraft('');
    setError('');
    setLastFailedPrompt('');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // The in-memory clear has already succeeded.
    }
    window.setTimeout(() => inputRef.current?.focus(), 30);
  };

  const openAssistant = () => {
    setOpen(true);
    setHasUnread(false);
  };

  const latestAssistantIndex = messages.reduce(
    (latest, message, index) => (message.role === 'assistant' ? index : latest),
    -1,
  );

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="OneStop Assistant chat" role="dialog" aria-modal="false">
          <header className={styles.header}>
            <div className={styles.headerIdentity}>
              <BotAvatar />
              <div>
                <strong>OneStop Assistant</strong>
                <span><i className={styles.onlineDot} aria-hidden="true" /> Online — replies instantly</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              {messages.length ? (
                <button type="button" onClick={clearConversation} aria-label="Clear chat" title="Clear chat">
                  ↺
                </button>
              ) : null}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close OneStop Assistant" title="Close">
                ×
              </button>
            </div>
          </header>

          <div className={styles.transcript} ref={transcriptRef} aria-live="polite">
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <span className={styles.welcomeEyebrow}>OneStop care, one chat</span>
                <h2>How can I help today?</h2>
                <p>
                  I can search live doctors, medicines, lab tests, hospitals, blood banks, and everyday products—then take you straight to booking or shopping.
                </p>
                <div className={styles.capabilities} aria-label="What OneStop Assistant can do">
                  <span><b>+</b> Doctors & appointments</span>
                  <span><b>Rx</b> Pharmacy & Rx guidance</span>
                  <span><b>◉</b> Labs, facilities & blood</span>
                </div>
                <div className={styles.chips} aria-label="Quick actions">
                  {QUICK_ACTIONS.map((action) => (
                    <button key={action} type="button" onClick={() => void sendMessage(action)} disabled={busy}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={message.role === 'user' ? styles.userRow : styles.assistantRow}
              >
                {message.role === 'assistant' ? (
                  <div className={styles.messageAvatar} aria-hidden="true"><BotAvatar compact /></div>
                ) : null}
                <article className={message.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                  <p>{message.content}</p>

                  {message.cards?.length ? (
                    <div className={styles.cardList}>
                      {message.cards.map((card) => <AssistantCardView key={`${card.type}-${card.id}`} card={card} />)}
                    </div>
                  ) : null}

                  {message.role === 'assistant' && index === latestAssistantIndex && message.suggestions?.length ? (
                    <div className={styles.chips} aria-label="Suggested follow-ups">
                      {message.suggestions.map((suggestion) => (
                        <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} disabled={busy}>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <time dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time>
                </article>
              </div>
            ))}

            {busy ? (
              <div className={styles.typingRow} role="status" aria-label="OneStop Assistant is typing">
                <div className={styles.messageAvatar} aria-hidden="true"><BotAvatar compact /></div>
                <div className={styles.typingBubble}>
                  <span className={styles.typingDots} aria-hidden="true"><i /><i /><i /></span>
                  <span>Checking OneStop for you…</span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className={styles.error} role="alert">
                <p>{error}</p>
                {lastFailedPrompt ? (
                  <button type="button" onClick={retryLast} disabled={busy}>Try again</button>
                ) : null}
              </div>
            ) : null}
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <label className={styles.visuallyHidden} htmlFor="onestop-assistant-input">
              Ask OneStop Assistant
            </label>
            <input
              ref={inputRef}
              id="onestop-assistant-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about doctors, medicines, tests…"
              maxLength={1200}
              autoComplete="off"
              enterKeyHint="send"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message" title="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.4 19.6 21 12 4.4 4.4l-.01 6.1L15 12 4.39 13.5l.01 6.1Z" />
              </svg>
            </button>
          </form>
          <p className={styles.disclaimer}>
            For emergencies, seek urgent care immediately. The assistant can make mistakes—please verify details before booking or ordering.
          </p>
        </section>
      ) : (
        <button
          type="button"
          className={styles.launcher}
          onClick={openAssistant}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Open OneStop Assistant"
        >
          <span className={styles.launcherIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H12l-4.4 3.7c-.6.5-1.6.1-1.6-.7V16H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" />
              <circle cx="8.5" cy="9.5" r="1.15" fill="currentColor" stroke="none" />
              <circle cx="12.5" cy="9.5" r="1.15" fill="currentColor" stroke="none" />
              <circle cx="16.5" cy="9.5" r="1.15" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className={styles.launcherLabel}>Ask OneStop</span>
          {hasUnread ? <span className={styles.unreadDot} aria-hidden="true" /> : null}
        </button>
      )}
    </div>
  );
}
