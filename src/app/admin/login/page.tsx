'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Неверный пароль');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-main)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '36px 28px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-craft)',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
          <Image
            src="/images/logo-round.webp"
            alt="НЕВДАХИНЪ логотип"
            fill
            sizes="80px"
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        <h1 style={{ fontSize: '26px', color: 'var(--bg-dark)', marginBottom: '4px' }}>
          НЕВДАХИНЪ
        </h1>
        <div
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-copper)',
            fontWeight: 700,
            marginBottom: '24px',
          }}
        >
          Панель управления мануфактурой
        </div>

        {error && (
          <div
            style={{
              background: 'var(--accent-red-light)',
              color: 'var(--accent-red)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #F6BEBE',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Пароль администратора</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                required
                placeholder="Введите пароль..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '15px', marginTop: '12px' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Вход...</span>
              </>
            ) : (
              <span>Войти в панель</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px dashed var(--border-craft)' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} />
            <span>Вернуться на сайт магазина</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
