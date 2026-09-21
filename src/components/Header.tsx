'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, MapPin, Phone, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}

export default function Header({ cartCount, cartTotal, onOpenCart }: HeaderProps) {
  return (
    <header className="header-wrapper">
      {/* Top micro-bar */}
      <div className="header-top">
        <div className="container header-top-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={13} style={{ color: 'var(--accent-amber)' }} />
            <span>
              д. Бурцево, ул. Раздолье, 236/2 <span className="sep-dot" /> Доставка в радиусе 4 км (от 5 000 ₽ бесплатно)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} style={{ color: 'var(--accent-green)' }} />
              100% натуральные фермерские ингредиенты
            </span>
            <Link
              href="/admin"
              title="Панель мастера"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.75 }}
            >
              <User size={13} />
              <span>Вход</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container header-inner">
        <Link href="/" className="header-brand">
          <Image
            src="/images/logo-round.webp"
            alt="НЕВДАХИНЪ логотип"
            width={52}
            height={52}
            className="header-brand-logo"
            priority
          />
          <div className="header-brand-text">
            <h1>НЕВДАХИНЪ</h1>
            <span>Семейная ремесленная мануфактура</span>
          </div>
        </Link>

        {/* Center menu links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '22px' }} className="desktop-nav">
          <a href="#catalog" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            Каталог
          </a>
          <a href="#about" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            О мастере
          </a>
          <a href="#delivery" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            Доставка (4 км)
          </a>
          <a href="#contacts" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            Контакты
          </a>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <a
            href="tel:+79200000000"
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Phone size={14} style={{ color: 'var(--accent-copper)' }} />
            <span>Связаться</span>
          </a>

          <button onClick={onOpenCart} className="header-cart-btn" aria-label="Корзина">
            <ShoppingBag size={18} />
            <span>{cartTotal > 0 ? `${cartTotal} ₽` : 'Корзина'}</span>
            {cartCount > 0 && <span className="header-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
