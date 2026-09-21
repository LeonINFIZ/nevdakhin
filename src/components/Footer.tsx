'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, ShieldCheck, Heart, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      id="contacts"
      style={{
        background: 'var(--bg-dark)',
        color: 'var(--text-light-muted)',
        padding: '56px 0 24px',
        borderTop: '1px solid var(--border-dark)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Image
                src="/images/logo-round.webp"
                alt="НЕВДАХИНЪ логотип"
                width={48}
                height={48}
                style={{
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  padding: '2px',
                }}
              />
              <div>
                <h3 style={{ fontSize: '22px', color: '#FFFFFF', lineHeight: 1 }}>НЕВДАХИНЪ</h3>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-amber)' }}>
                  Семейная ремесленная мануфактура
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '20px', maxWidth: '340px' }}>
              Домашнее производство натуральных деликатесов. Семейные рецепты, отборное фермерское мясо, автоклавное томление и горячее копчение на ольховой щепе.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-gold)' }}>
              <ShieldCheck size={16} />
              <span>Без химии • Без консервантов • 100% мясо</span>
            </div>
          </div>

          {/* Delivery & Pickup Info */}
          <div id="delivery">
            <h4 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '14px' }}>
              Доставка и самовывоз
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} style={{ color: 'var(--accent-copper)', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Адрес цеха:</strong> 607611, Нижегородская обл., Богородский м.о., д. Бурцево, ул. Раздолье, 236/2
                </span>
              </div>

              <div>
                <strong>Курьерская доставка:</strong> в радиусе 4 км от производства.
                <div style={{ color: 'var(--accent-amber)', marginTop: '2px' }}>
                  250 ₽ (бесплатно при заказе от 5 000 ₽)
                </div>
              </div>

              <div>
                <strong>Самовывоз:</strong> бесплатно в удобное для вас время по предварительной договоренности.
              </div>
            </div>
          </div>

          {/* Legal and Maker info */}
          <div id="about">
            <h4 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '14px' }}>
              Реквизиты производителя
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div><strong>Производитель:</strong> ИП Невдахин Дмитрий Викторович</div>
              <div><strong>ОГРНИП:</strong> 317527500056271</div>
              <div><strong>ИНН:</strong> 526098175957</div>
              <div style={{ marginTop: '8px' }}>
                <a
                  href="tel:+79200000000"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  <Phone size={14} style={{ color: 'var(--accent-copper)' }} />
                  <span>Телефон для справок и заказов</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: '24px',
            borderTop: '1px solid var(--border-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '12px',
          }}
        >
          <div>
            © {new Date().getFullYear()} Мануфактура «НЕВДАХИНЪ». Все права защищены.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>Сделано с душой и заботой</span>
            <Link
              href="/admin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--text-light-muted)',
                opacity: 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
            >
              <Lock size={12} />
              <span>Панель управления</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
