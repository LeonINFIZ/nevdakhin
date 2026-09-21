'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Flame, HeartHandshake, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AboutMaster() {
  return (
    <section
      id="about"
      className="scroll-section"
      style={{
        background: 'linear-gradient(180deg, #FBF8F3 0%, #F5EDE1 100%)',
        borderTop: '1px solid var(--border-craft)',
        borderBottom: '1px solid var(--border-craft)',
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
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
              marginBottom: '14px',
            }}
          >
            <Award size={15} />
            <span>История мануфактуры <span className="sep-dot" /> Честное ремесло</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(32px, 3.5vw, 44px)',
              color: 'var(--bg-dark)',
              marginBottom: '16px',
              lineHeight: 1.15,
            }}
          >
            Дело жизни Дмитрия Невдахина
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            От семейных традиций на дачном участке в деревне Бурцево — к домашней интернет-лавке настоящих деликатесов.
          </p>
        </div>

        {/* Main Grid: Photo + Story */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1.25fr)',
            gap: '52px',
            alignItems: 'center',
          }}
          className="about-grid"
        >
          {/* Left Column: Real Photo of Dmitry */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                border: '3px solid #FFFFFF',
                outline: '2px solid var(--border-craft)',
                background: '#EAE1D3',
                aspectRatio: '3 / 4',
                maxHeight: '620px',
                width: '100%',
              }}
            >
              <Image
                src="/images/person.webp"
                alt="Дмитрий Невдахин в цехе семейной мануфактуры"
                fill
                sizes="(max-width: 900px) 100vw, 550px"
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                priority
              />

              {/* Gradient Overlay for bottom caption */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(20, 18, 16, 0.85) 0%, rgba(20, 18, 16, 0.1) 45%, transparent 100%)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  right: '24px',
                  color: '#FFFFFF',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} />
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-amber)', fontWeight: 700 }}>
                    Семейное производство
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, lineHeight: 1.2 }}>
                  Дмитрий Невдахин
                </div>
                <div style={{ fontSize: '13px', color: '#DDD2C4', marginTop: '2px' }}>
                  Основатель, мастер-технолог и автор рецептур
                </div>
              </div>
            </div>

            {/* Floating Quality Badge */}
            <div
              className="about-floating-badge"
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: 'var(--bg-dark)',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px 18px',
                border: '2px solid var(--accent-copper)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <ShieldCheck size={24} style={{ color: 'var(--accent-copper)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1 }}>100% Ручная работа</div>
                <div style={{ fontSize: '11px', color: 'var(--text-light-muted)', marginTop: '2px' }}>Личный контроль мастера</div>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Philosophy */}
          <div>
            <h3
              style={{
                fontSize: '28px',
                color: 'var(--bg-dark)',
                marginBottom: '18px',
                lineHeight: 1.25,
              }}
            >
              «Я делаю этот продукт так, как готовил бы для своих детей и самых близких»
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.7 }}>
              <p>
                История мануфактуры «НЕВДАХИНЪ» началась на обычном дачном участке в деревне Бурцево Нижегородской области.
                Желание кормить семью настоящими, чистыми продуктами без магазинных красителей, фосфатов и консервантов 
                привело к созданию собственного автоклава и коптильни.
              </p>
              <p>
                Сначала тушенка, домашняя краковская колбаса и сочные пельмени готовились только для родных и друзей.
                Но слух о насыщенном вкусе настоящего мяса быстро разошелся по округе — так домашнее дело выросло в ремесленную 
                мануфактуру, сохраняющую тепло ручного труда.
              </p>
            </div>

            {/* Craft Pillars */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                margin: '28px 0',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-craft)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', color: 'var(--bg-dark)', marginBottom: '6px' }}>
                  <Flame size={18} style={{ color: 'var(--accent-copper)' }} />
                  <span>Ольховый дым</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Классическое горячее копчение на натуральной ольховой и яблоневой щепе. Никакого жидкого дыма.
                </p>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-craft)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', color: 'var(--bg-dark)', marginBottom: '6px' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-green)' }} />
                  <span>Только отборное мясо</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Фермерская свинина и говядина высшего сорта, натуральные специи, свежий чеснок и крупная соль.
                </p>
              </div>
            </div>

            {/* Master's Guarantee Note */}
            <div
              style={{
                background: 'var(--bg-craft)',
                borderLeft: '4px solid var(--accent-copper)',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                padding: '18px 20px',
                borderTop: '1px solid var(--border-craft)',
                borderRight: '1px solid var(--border-craft)',
                borderBottom: '1px solid var(--border-craft)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '17px',
                  fontStyle: 'italic',
                  color: 'var(--bg-dark)',
                  lineHeight: 1.6,
                  marginBottom: '10px',
                }}
              >
                «Здесь нет конвейера и десятков наемных рабочих. Каждую партию тушенки в автоклаве, каждое кольцо колбасы 
                и каждую партию пельменей я контролирую лично. Я отвечаю за качество своим именем на этикетке.»
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartHandshake size={16} style={{ color: 'var(--accent-copper)' }} />
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                  Дмитрий Невдахин <span className="sep-dot" /> д. Бурцево
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .about-floating-badge {
            top: 12px !important;
            right: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
