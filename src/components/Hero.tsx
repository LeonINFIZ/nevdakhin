'use client';

import React from 'react';
import Image from 'next/image';
import { Flame, ShieldCheck, Sparkles, Truck, Award } from 'lucide-react';

export default function Hero() {
  return (
    <section
      style={{
        background: 'linear-gradient(180deg, #F5EDE1 0%, #FBF8F3 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '48px 0 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
            gap: '40px',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left Column: Text & Accents */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(194, 98, 42, 0.1)',
                border: '1px solid rgba(194, 98, 42, 0.25)',
                color: 'var(--accent-copper)',
                fontWeight: 600,
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              <Award size={15} />
              <span>Домашнее ремесленное производство <span className="sep-dot" /> Семейные рецепты</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                color: 'var(--bg-dark)',
                marginBottom: '16px',
                lineHeight: 1.1,
              }}
            >
              Настоящие домашние деликатесы ручной работы
            </h1>

            <p
              style={{
                fontSize: '17px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                marginBottom: '28px',
                maxWidth: '560px',
              }}
            >
              Готовим для вас с душой на собственном дачном участке в деревне Бурцево: 
              настоящая томленая тушенка, хрустящие соления, горячее копчение на ольховой щепе, 
              колбасы и сочные пельмени ручной лепки. Никакой химии и консервантов.
            </p>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <a href="#catalog" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>
                <Sparkles size={16} />
                <span>Выбрать деликатесы</span>
              </a>
              <a href="#about" className="btn-secondary" style={{ padding: '14px 24px', fontSize: '15px' }}>
                <span>История мастера</span>
              </a>
            </div>

            {/* Trust hallmarks list */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '14px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-craft)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-craft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-copper)',
                  }}
                >
                  <Flame size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--bg-dark)' }}>Ольховый дым</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Без жидкого дыма</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-craft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-green)',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--bg-dark)' }}>100% Мясо</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Фермерское сырье</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-craft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-amber)',
                  }}
                >
                  <Truck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--bg-dark)' }}>Доставка 4 км</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Или самовывоз</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Artisan Emblem Card */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '420px',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px',
                border: '2px solid var(--border-craft)',
                boxShadow: 'var(--shadow-md)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1.15',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#F8F4EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed var(--border-craft)',
                  marginBottom: '16px',
                }}
              >
                <Image
                  src="/images/logo.webp"
                  alt="НЕВДАХИНЪ гравюра мастера"
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  style={{ objectFit: 'contain', padding: '16px' }}
                  priority
                />
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--bg-dark)',
                  lineHeight: 1.2,
                }}
              >
                Дмитрий Невдахин
              </div>
              <div
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-copper)',
                  fontWeight: 700,
                  marginTop: '4px',
                }}
              >
                Мастер-ремесленник мануфактуры
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
