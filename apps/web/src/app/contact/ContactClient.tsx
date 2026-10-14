'use client';

import { useState } from 'react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { API_BASE_URL, getErrorMessage } from '../../lib/auth/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #d7e3e0',
  fontSize: 15,
};

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(getErrorMessage(payload));
      setStatus('sent');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 72px' }}>
      <Breadcrumbs items={[{ name: 'Contact us', path: '/contact' }]} />
      <h1>Contact us</h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7 }}>
        Questions about a booking, an order, or becoming a verified doctor or pharmacy?
        Send us a message and our team will reply within one working day.
      </p>

      {status === 'sent' ? (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <strong>Message received.</strong>
          <p style={{ margin: '8px 0 0' }}>Thank you for reaching out — we will get back to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Your name
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="e.g. Ahmed Raza" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Email
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={160} placeholder="you@example.com" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Subject
            <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={160} placeholder="e.g. Question about my lab booking" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Message
            <textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={4000} placeholder="How can we help?" />
          </label>
          {status === 'error' && (
            <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              background: '#0f766e',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: 999,
              border: 0,
              fontWeight: 700,
              fontSize: 16,
              cursor: status === 'sending' ? 'wait' : 'pointer',
              opacity: status === 'sending' ? 0.7 : 1,
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 40, padding: 20, borderRadius: 12, background: '#f8fafc' }}>
        <strong>Prefer to reach us directly?</strong>
        <p style={{ margin: '8px 0' }}>
          Email: <a href="mailto:support@onestop.life">support@onestop.life</a>
          <br />
          Phone: <a href="tel:+923001234567">+92 300 1234567</a>
          <br />
          Emergency: call <a href="tel:15">15</a> or <a href="tel:1122">Rescue 1122</a>
        </p>
      </div>
    </main>
  );
}
