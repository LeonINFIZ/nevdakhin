'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Recipe, Product } from '@/types';
import {
  BookOpen,
  Clock,
  Users,
  Video,
  ArrowRight,
  Plus,
  ShoppingBag,
  Sparkles,
  Search,
  Check,
  ChevronRight,
} from 'lucide-react';

export default function RecipesPage() {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const [recRes, prodRes] = await Promise.all([
          fetch('/api/recipes'),
          fetch('/api/products'),
        ]);

        if (recRes.ok) {
          const recData = await recRes.json();
          setRecipes(recData);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredRecipes = recipes.filter((r) => {
    if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.product_title && r.product_title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getProductForRecipe = (recipe: Recipe): Product | undefined => {
    if (!recipe.product_id) return undefined;
    return products.find((p) => p.id === recipe.product_id);
  };

  const getQuantityInCart = (productId?: number | null): number => {
    if (!productId) return 0;
    const item = cartItems.find((ci) => ci.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
      <Header />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Breadcrumbs */}
        <div style={{ background: '#F5EFE6', borderBottom: '1px solid var(--border-craft)', padding: '12px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Главная
            </Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--accent-copper)', fontWeight: 600 }}>Рецепты от мастера</span>
          </div>
        </div>

        {/* Hero Section */}
        <section
          style={{
            background: 'linear-gradient(180deg, #F5EFE6 0%, #FBF8F3 100%)',
            padding: '40px 0 30px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="container" style={{ textAlign: 'center', maxWidth: '820px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(194, 98, 42, 0.1)',
                border: '1px solid rgba(194, 98, 42, 0.25)',
                color: 'var(--accent-copper)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '14px',
              }}
            >
              <Sparkles size={14} />
              <span>Семейные ремесленные рецепты</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontFamily: 'var(--font-heading)',
                color: 'var(--bg-dark)',
                marginBottom: '14px',
                lineHeight: 1.2,
              }}
            >
              Как вкусно приготовить деликатесы «НЕВДАХИНЪ»
            </h1>

            <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: '680px' }}>
              Пошаговые фоторецепты, секреты томления мяса и видеоинструкции от мастера Дмитрия.
              Каждое блюдо легко приготовить дома, а нужный деликатес можно заказать в один клик прямо со страницы рецепта.
            </p>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
                <Search
                  size={18}
                  style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9E9489' }}
                />
                <input
                  type="text"
                  placeholder="Поиск по рецептам или деликатесам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{
                    paddingLeft: '44px',
                    borderRadius: 'var(--radius-full)',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-craft)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    height: '46px',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Difficulty tabs */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { id: 'all', label: 'Все рецепты' },
                  { id: 'Легко', label: '🥗 Легко' },
                  { id: 'Средне', label: '🥘 Средне' },
                  { id: 'Мастер', label: '👨‍🍳 Мастер' },
                ].map((tab) => {
                  const isActive = difficultyFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDifficultyFilter(tab.id)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: isActive ? '1px solid var(--accent-copper)' : '1px solid var(--border-craft)',
                        background: isActive ? 'var(--accent-copper)' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Recipes Grid */}
        <section className="container" style={{ paddingTop: '36px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Загрузка ремесленных рецептов...
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-craft)',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📖</div>
              <h3 style={{ fontSize: '20px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
                Рецепты не найдены
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Попробуйте изменить запрос в строке поиска или сбросить фильтр сложности.
              </p>
              <button
                onClick={() => {
                  setDifficultyFilter('all');
                  setSearchQuery('');
                }}
                className="btn-secondary"
                style={{ padding: '8px 18px' }}
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '28px',
              }}
            >
              {filteredRecipes.map((recipe) => {
                const product = getProductForRecipe(recipe);
                const qtyInCart = product ? getQuantityInCart(product.id) : 0;

                return (
                  <article
                    key={recipe.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-craft)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                  >
                    {/* Cover Image & Badges */}
                    <Link
                      href={`/recipes/${recipe.slug}`}
                      style={{
                        position: 'relative',
                        height: '210px',
                        width: '100%',
                        display: 'block',
                        background: '#EDE5D8',
                      }}
                    >
                      <Image
                        src={recipe.cover_image || '/images/products/tushenka.jpg'}
                        alt={recipe.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        style={{ objectFit: 'cover' }}
                      />

                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            background: '#3A6347',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {recipe.difficulty}
                        </span>

                        {recipe.video_url && (
                          <span
                            style={{
                              background: 'rgba(0,0,0,0.75)',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Video size={12} />
                            Видео
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          position: 'absolute',
                          bottom: '12px',
                          right: '12px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--bg-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <Clock size={13} style={{ color: 'var(--accent-copper)' }} />
                        <span>{recipe.prep_time}</span>
                        <span style={{ color: '#D4C9BC' }}>•</span>
                        <Users size={13} style={{ color: 'var(--accent-copper)' }} />
                        <span>{recipe.portions}</span>
                      </div>
                    </Link>

                    {/* Card Body */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h2
                          style={{
                            fontSize: '19px',
                            fontFamily: 'var(--font-heading)',
                            color: 'var(--bg-dark)',
                            marginBottom: '8px',
                            lineHeight: 1.3,
                          }}
                        >
                          <Link
                            href={`/recipes/${recipe.slug}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {recipe.title}
                          </Link>
                        </h2>

                        {recipe.description && (
                          <p
                            style={{
                              fontSize: '13.5px',
                              color: 'var(--text-muted)',
                              lineHeight: 1.5,
                              marginBottom: '16px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {recipe.description}
                          </p>
                        )}
                      </div>

                      {/* Product Order Bar / Widget */}
                      <div>
                        {product && (
                          <div
                            style={{
                              background: 'var(--bg-craft)',
                              border: '1px solid var(--border-craft)',
                              borderRadius: 'var(--radius-md)',
                              padding: '10px 12px',
                              marginBottom: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <div
                                style={{
                                  position: 'relative',
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  background: '#EAE2D5',
                                }}
                              >
                                <Image
                                  src={product.images?.[0] || '/images/products/tushenka.jpg'}
                                  alt={product.title}
                                  fill
                                  sizes="40px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    color: 'var(--bg-dark)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {product.title}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--accent-copper)', fontWeight: 700 }}>
                                  {product.price} ₽
                                </div>
                              </div>
                            </div>

                            {qtyInCart > 0 ? (
                              <button
                                onClick={() => updateQuantity(product.id, qtyInCart + 1)}
                                style={{
                                  background: '#3A6347',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 'var(--radius-full)',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                <Check size={13} />
                                <span>В корзине ({qtyInCart})</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                className="btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                <ShoppingBag size={13} />
                                <span>Заказать</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Read Recipe Button */}
                        <Link
                          href={`/recipes/${recipe.slug}`}
                          className="btn-recipe-modal"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '11px 16px',
                            background: '#FFFFFF',
                            border: '1.5px solid var(--accent-copper)',
                            color: 'var(--accent-copper)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-copper)';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.color = 'var(--accent-copper)';
                          }}
                        >
                          <BookOpen size={16} />
                          <span>Пошаговый рецепт</span>
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
