'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, ArrowRight, Sparkles, ChefHat, PlayCircle, Flame } from 'lucide-react';

export default function RecipesBanner() {
  const featuredRecipes = [
    {
      slug: 'tushenka-s-grechkoy-i-lesnymi-gribami',
      title: 'Томленая тушенка с гречкой и грибами',
      time: '35 мин',
      difficulty: 'Легко',
      image: '/images/products/tushenka.jpg',
      desc: 'Рассыпчатая каша, пропитанная натуральным мясным соком и ароматом лесных трав.',
    },
    {
      slug: 'derevenskaya-yaichnitsa-s-krakovskoy-kolbasoy',
      title: 'Деревенская яичница с краковской колбасой',
      time: '15 мин',
      difficulty: 'Быстро',
      image: '/images/products/krakovskaya.jpg',
      desc: 'Сочная пряная колбаса на ольховой щепе с глазуньей из домашних яиц и зеленью.',
    },
    {
      slug: 'pelmeni-s-toplenym-maslom-i-sousom',
      title: 'Пельмени ручной лепки с топленым маслом',
      time: '20 мин',
      difficulty: 'Традиции',
      image: '/images/products/pelmeni.jpg',
      desc: 'Тонкое эластичное тесто, сочный фарш из фермерского мяса и нежный соус.',
    },
  ];

  return (
    <section
      className="scroll-section"
      style={{
        background: 'linear-gradient(180deg, #F9F5EE 0%, #F4EDE0 100%)',
        borderTop: '1px solid var(--border-craft)',
        borderBottom: '1px solid var(--border-craft)',
        padding: '70px 0 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient subtle background spots */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(194, 98, 42, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46, 125, 50, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header Badge & Title */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 40px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(194, 98, 42, 0.1)',
              border: '1px solid rgba(194, 98, 42, 0.25)',
              color: 'var(--accent-copper)',
              fontWeight: 600,
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <ChefHat size={16} />
            <span>Кулинарные секреты мастера <span className="sep-dot" /> Пошаговые рецепты</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(28px, 3.2vw, 40px)',
              color: 'var(--bg-dark)',
              marginBottom: '14px',
              lineHeight: 1.2,
            }}
          >
            Готовьте шедевры с деликатесами «НЕВДАХИНЪ»
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            Каждый наш продукт создан для того, чтобы стать основой вкусного домашнего блюда. 
            Мы подготовили пошаговые рецепты с точными граммовками, секретами обжарки и видео 
            от мастера, чтобы вы радовали семью настоящими застольями без лишних хлопот.
          </p>
        </div>

        {/* 3 Featured Recipe Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
          className="recipes-banner-grid"
        >
          {featuredRecipes.map((r, idx) => (
            <Link
              key={idx}
              href={`/recipes/${r.slug}`}
              className="recipe-card-promo"
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid var(--border-craft)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {/* Image Preview Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  overflow: 'hidden',
                  background: '#EAE2D5',
                }}
              >
                <Image
                  src={r.image}
                  alt={r.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 380px"
                  style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  className="recipe-promo-img"
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(26, 17, 8, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={12} />
                    {r.time}
                  </span>
                  <span
                    style={{
                      background: 'rgba(194, 98, 42, 0.9)',
                      color: '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {r.difficulty}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--bg-dark)',
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}
                >
                  {r.title}
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    flex: 1,
                  }}
                >
                  {r.desc}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent-copper)',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    borderTop: '1px dashed var(--border-subtle)',
                    paddingTop: '12px',
                  }}
                >
                  <span>Смотреть пошаговый рецепт</span>
                  <ArrowRight size={15} style={{ transition: 'transform 0.2s ease' }} className="recipe-promo-arrow" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 3 Feature Pillars */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.65)',
            border: '1px solid var(--border-craft)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '32px',
          }}
          className="recipes-features-bar"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(194, 98, 42, 0.12)',
                color: 'var(--accent-copper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--bg-dark)' }}>
                Пошаговые инструкции
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Точные граммовки и время
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(194, 98, 42, 0.12)',
                color: 'var(--accent-copper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PlayCircle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--bg-dark)' }}>
                Видео-секреты от мастера
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Нюансы томления и подачи
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(46, 125, 50, 0.12)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--bg-dark)' }}>
                Деликатесы к рецепту
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Добавление в корзину в 1 клик
              </div>
            </div>
          </div>
        </div>

        {/* Big Call to Action Button */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/recipes"
            className="btn-primary recipes-cta-btn"
            style={{
              padding: '16px 36px',
              fontSize: '16px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(194, 98, 42, 0.3)',
              textDecoration: 'none',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <BookOpen size={20} style={{ flexShrink: 0 }} />
            <span>Перейти в каталог пошаговых рецептов</span>
            <ArrowRight size={18} style={{ flexShrink: 0 }} />
          </Link>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '10px',
            }}
          >
            Все рецепты составлены на основе продукции мануфактуры и доступны бесплатно
          </div>
        </div>
      </div>

      <style jsx>{`
        .recipe-card-promo:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08) !important;
          border-color: var(--accent-copper) !important;
        }
        .recipe-card-promo:hover .recipe-promo-img {
          transform: scale(1.05);
        }
        .recipe-card-promo:hover .recipe-promo-arrow {
          transform: translateX(4px);
        }
        @media (max-width: 768px) {
          .recipes-features-bar {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 640px) {
          .recipes-cta-btn {
            width: 100% !important;
            padding: 14px 16px !important;
            font-size: 14.5px !important;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
