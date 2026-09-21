'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Recipe, Product } from '@/types';
import {
  BookOpen,
  Clock,
  Users,
  Video,
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Check,
  ChefHat,
  Share2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function RecipeDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToCart, updateQuantity, cartItems } = useCart();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const res = await fetch(`/api/recipes?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          router.push('/recipes');
          return;
        }
        const data: Recipe = await res.json();
        setRecipe(data);

        if (data.product_id) {
          const prodRes = await fetch('/api/products');
          if (prodRes.ok) {
            const allProducts: Product[] = await prodRes.json();
            const matched = allProducts.find((p) => p.id === data.product_id);
            if (matched) setProduct(matched);
          }
        }
      } catch (err) {
        console.error('Error loading recipe:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [slug, router]);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const getQuantityInCart = (productId?: number | null): number => {
    if (!productId) return 0;
    const item = cartItems.find((ci) => ci.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Helper to convert YouTube URL to embed URL if needed
  const getEmbedVideoUrl = (url?: string): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return url;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍲</div>
            <div>Загрузка фирменного рецепта...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <h2>Рецепт не найден</h2>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0 20px' }}>
              Возможно, этот рецепт был перемещен или снят с публикации.
            </p>
            <Link href="/recipes" className="btn-primary">
              Ко всем рецептам
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const embedUrl = getEmbedVideoUrl(recipe.video_url);
  const qtyInCart = product ? getQuantityInCart(product.id) : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
      <Header />

      <main style={{ flex: 1, paddingBottom: '80px' }}>
        {/* Breadcrumbs */}
        <div style={{ background: '#F5EFE6', borderBottom: '1px solid var(--border-craft)', padding: '12px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Главная
            </Link>
            <ChevronRight size={14} />
            <Link href="/recipes" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Рецепты
            </Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--accent-copper)', fontWeight: 600 }}>{recipe.title}</span>
          </div>
        </div>

        {/* Recipe Header Banner */}
        <section className="container" style={{ paddingTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <Link
              href="/recipes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} />
              <span>Назад ко всем рецептам</span>
            </Link>

            <button
              onClick={handleShare}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-craft)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-main)',
              }}
            >
              {copiedLink ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Ссылка скопирована!' : 'Поделиться рецептом'}</span>
            </button>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-craft)',
              padding: 'clamp(24px, 4vw, 40px)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '32px',
            }}
          >
            {/* Badges & Meta */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
              <span
                style={{
                  background: '#3A6347',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {recipe.difficulty}
              </span>

              {recipe.video_url && (
                <span
                  style={{
                    background: 'rgba(0,0,0,0.8)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Video size={13} />
                  <span>Видеоурок</span>
                </span>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                }}
              >
                <Clock size={15} style={{ color: 'var(--accent-copper)' }} />
                <span>Время: <strong>{recipe.prep_time}</strong></span>
                <span style={{ color: '#DDD' }}>•</span>
                <Users size={15} style={{ color: 'var(--accent-copper)' }} />
                <span>Порции: <strong>{recipe.portions}</strong></span>
              </div>
            </div>

            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontFamily: 'var(--font-heading)',
                color: 'var(--bg-dark)',
                lineHeight: 1.25,
                marginBottom: '16px',
              }}
            >
              {recipe.title}
            </h1>

            {recipe.description && (
              <p
                style={{
                  fontSize: '16px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  maxWidth: '850px',
                }}
              >
                {recipe.description}
              </p>
            )}

            {/* Media Box: Video or Cover Photo */}
            <div
              style={{
                marginTop: '28px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                position: 'relative',
                background: '#EDE5D8',
                border: '1px solid var(--border-craft)',
              }}
            >
              {embedUrl ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={embedUrl}
                    title={recipe.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: 'clamp(280px, 45vw, 500px)' }}>
                  <Image
                    src={recipe.cover_image || '/images/products/tushenka.jpg'}
                    alt={recipe.title}
                    fill
                    sizes="(max-width: 1200px) 100vw, 1100px"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Recipe Body */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
              gap: '32px',
              alignItems: 'start',
            }}
            className="recipe-layout-grid"
          >
            {/* Column 1: Ingredients & Sticky Order Widget */}
            <div>
              {/* Ingredients Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-craft)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ChefHat size={20} style={{ color: 'var(--accent-copper)' }} />
                  <h3 style={{ fontSize: '18px', color: 'var(--bg-dark)' }}>Ингредиенты</h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Отмечайте галочками продукты по ходу готовки:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recipe.ingredients.map((ing, idx) => {
                    const isChecked = !!checkedIngredients[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleIngredient(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isChecked ? 'rgba(58, 99, 71, 0.06)' : 'var(--bg-craft)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              border: isChecked ? '2px solid #3A6347' : '2px solid #CCC',
                              background: isChecked ? '#3A6347' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              flexShrink: 0,
                            }}
                          >
                            {isChecked && <Check size={12} />}
                          </div>
                          <span
                            style={{
                              fontSize: '13.5px',
                              color: isChecked ? 'var(--text-muted)' : 'var(--text-main)',
                              textDecoration: isChecked ? 'line-through' : 'none',
                              fontWeight: isChecked ? 400 : 500,
                            }}
                          >
                            {ing.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: isChecked ? 'var(--text-muted)' : 'var(--accent-copper)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ing.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bound Product Quick Order Widget */}
              {product && (
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid var(--accent-copper)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: 'var(--accent-copper)',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Главный деликатес к рецепту:</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: '#EDE5D8',
                      }}
                    >
                      <Image
                        src={product.images?.[0] || '/images/products/tushenka.jpg'}
                        alt={product.title}
                        fill
                        sizes="64px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', color: 'var(--bg-dark)', marginBottom: '3px', lineHeight: 1.3 }}>
                        {product.title}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {product.weight || 'Фирменная упаковка'}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-copper)', marginTop: '2px' }}>
                        {product.price} ₽
                      </div>
                    </div>
                  </div>

                  {qtyInCart > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div className="qty-control" style={{ flex: 1 }}>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, qtyInCart - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-num">{qtyInCart} шт</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, qtyInCart + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <Link
                        href="/cart"
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '12.5px', textDecoration: 'none' }}
                      >
                        В заказ →
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="btn-primary"
                      style={{ width: '100%', padding: '10px 16px', fontSize: '13.5px' }}
                    >
                      <ShoppingBag size={16} />
                      <span>Добавить в корзину</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Step-by-Step Instructions */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {recipe.steps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-craft)',
                      padding: '24px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--accent-copper)',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {step.step_number || idx + 1}
                      </span>
                      <h3
                        style={{
                          fontSize: '20px',
                          fontFamily: 'var(--font-heading)',
                          color: 'var(--bg-dark)',
                        }}
                      >
                        {step.title}
                      </h3>
                    </div>

                    <p style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: step.image_url || step.tip ? '16px' : 0 }}>
                      {step.description}
                    </p>

                    {/* Step Image */}
                    {step.image_url && (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '240px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          marginBottom: step.tip ? '14px' : 0,
                          border: '1px solid var(--border-craft)',
                        }}
                      >
                        <Image
                          src={step.image_url}
                          alt={step.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 600px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Master Dmitry's Secret / Tip */}
                    {step.tip && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(217, 130, 43, 0.08) 0%, rgba(194, 98, 42, 0.12) 100%)',
                          border: '1px solid rgba(217, 130, 43, 0.3)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}
                      >
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--accent-copper)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                            Секрет мастера Дмитрия:
                          </div>
                          <div style={{ fontSize: '13.5px', color: 'var(--bg-dark)', lineHeight: 1.5 }}>
                            {step.tip}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* End of Recipe Ordering Section */}
              {product && (
                <div
                  style={{
                    marginTop: '36px',
                    background: 'linear-gradient(135deg, #2C241D 0%, #1A1511 100%)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '32px',
                    color: '#FFFFFF',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    <Sparkles size={16} />
                    <span>Готовьте с удовольствием</span>
                  </div>

                  <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: '#FFFFFF', marginBottom: '10px' }}>
                    Закажите деликатес для этого блюда
                  </h3>

                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6, marginBottom: '20px', maxWidth: '600px' }}>
                    Натуральное фермерское мясо без консервантов и добавок. Мы приготовили этот деликатес в автоклаве по старинной технологии, сохранив весь сок и аромат.
                  </p>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '54px',
                          height: '54px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#EAE2D5',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={product.images?.[0] || '/images/products/tushenka.jpg'}
                          alt={product.title}
                          fill
                          sizes="54px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#FFFFFF' }}>
                          {product.title}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--accent-amber)' }}>
                          {product.weight && `${product.weight} • `}{product.price} ₽
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {qtyInCart > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', color: '#A6D4B2' }}>✓ В заказе: {qtyInCart} шт</span>
                          <Link
                            href="/cart"
                            className="btn-primary"
                            style={{ padding: '10px 18px', textDecoration: 'none' }}
                          >
                            Перейти в корзину
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="btn-primary"
                          style={{ padding: '12px 24px', fontSize: '14px' }}
                        >
                          <ShoppingBag size={17} />
                          <span>Добавить в корзину ({product.price} ₽)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
