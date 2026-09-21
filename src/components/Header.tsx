'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, MapPin, Phone, ShieldCheck, User, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface HeaderProps {
  // Optional props in case passed, but useCart is default
  cartCount?: number;
  cartTotal?: number;
  onOpenCart?: () => void;
}

export default function Header({}: HeaderProps) {
  const { cartCount, cartTotal } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = Math.round(headerRef.current.getBoundingClientRect().height);
        if (height > 0) {
          document.documentElement.style.setProperty('--header-height', `${height}px`);
        }
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <header className="header-wrapper" ref={headerRef}>
      {/* Top micro-bar */}
      <div className="header-top">
        <div className="container header-top-inner">
          <div className="header-top-left">
            <MapPin size={13} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            <span>
              д. Бурцево <span className="sep-dot" /> Доставка 4 км (от 5 000 ₽ бесплатно)
            </span>
          </div>

          <div className="header-top-right">
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} style={{ color: 'var(--accent-green)' }} />
              100% натурально
            </span>
            <Link
              href="/admin"
              title="Панель мастера"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}
            >
              <User size={13} />
              <span>Панель мастера</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="container header-inner">
        {/* Brand */}
        <Link href="/" className="header-brand">
          <Image
            src="/images/logo-round.webp"
            alt="НЕВДАХИНЪ логотип"
            width={50}
            height={50}
            className="header-brand-logo"
            priority
          />
          <div className="header-brand-text">
            <h1>НЕВДАХИНЪ</h1>
            <span>Семейная ремесленная мануфактура</span>
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="desktop-nav">
          <a href="/#catalog" className="header-nav-link">
            Каталог
          </a>
          <Link href="/recipes" className="header-nav-link">
            Рецепты
          </Link>
          <a href="/#about" className="header-nav-link">
            О мастере
          </a>
          <a href="/#delivery" className="header-nav-link">
            Доставка (4 км)
          </a>
          <a href="/#contacts" className="header-nav-link">
            Контакты
          </a>
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Clickable Phone Text */}
          <a
            href="tel:+79200000000"
            className="header-phone-link"
            title="Позвонить мастеру Дмитрию: +7 (920) 000-00-00"
          >
            <Phone size={14} className="header-phone-icon" />
            <div className="header-phone-details">
              <span className="header-phone-number">
                <span className="phone-full">+7 (920) 000-00-00</span>
                <span className="phone-short">Позвонить</span>
              </span>
              <span className="header-phone-sub">Telegram / MAX</span>
            </div>
          </a>

          {/* Cart Button linking to /cart */}
          <Link href="/cart" className="header-cart-btn" aria-label="Корзина">
            <ShoppingBag size={18} />
            <span className="header-cart-text">
              {cartTotal > 0 ? `${cartTotal} ₽` : 'Корзина'}
            </span>
            {cartCount > 0 && <span className="header-cart-badge">{cartCount}</span>}
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-toggle"
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="container" style={{ padding: '16px 20px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
              <Link
                href="/#catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-item"
              >
                Каталог деликатесов
              </Link>
              <Link
                href="/recipes"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-item"
              >
                📖 Рецепты приготовления
              </Link>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-item"
              >
                О мастере
              </Link>
              <Link
                href="/#delivery"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-item"
              >
                Доставка и самовывоз (4 км)
              </Link>
              <Link
                href="/#contacts"
                onClick={() => setMobileMenuOpen(false)}
                className="mobile-nav-item"
              >
                Контакты и реквизиты
              </Link>
            </nav>

            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-craft)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href="tel:+79200000000"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--accent-copper)',
                }}
              >
                <Phone size={18} />
                <span>+7 (920) 000-00-00</span>
              </a>

              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary"
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                <ShoppingBag size={18} />
                <span>Перейти в корзину ({cartCount > 0 ? `${cartTotal} ₽` : '0 ₽'})</span>
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                <User size={15} />
                <span>Панель управления мастера</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
