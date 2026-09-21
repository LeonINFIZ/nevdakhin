'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryNav from '@/components/CategoryNav';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import CartDrawer from '@/components/CartDrawer';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import Footer from '@/components/Footer';
import { Category, Product, CartItem, Order } from '@/types';
import { ShoppingBag, Loader2, Sparkles, HeartHandshake, ShieldCheck, Flame } from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Load categories and products on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);

        if (catRes.ok && prodRes.ok) {
          const cats = await catRes.json();
          const prods = await prodRes.json();
          setCategories(cats);
          setProducts(prods);
        }
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Restore cart from localStorage
    try {
      const savedCart = localStorage.getItem('nevdakhin_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nevdakhin_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Cart calculations
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  // Cart actions
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('nevdakhin_cart');
    } catch {}
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (activeCategory !== 'all') {
        const cat = categories.find((c) => c.slug === activeCategory);
        if (cat && prod.category_id !== cat.id) return false;
      }

      // Subcategory filter
      if (activeSubcategory) {
        const cat = categories.find((c) => c.slug === activeCategory);
        const sub = cat?.subcategories?.find((s) => s.slug === activeSubcategory);
        if (sub && prod.subcategory_id !== sub.id) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = prod.title.toLowerCase().includes(q);
        const matchDesc = prod.description.toLowerCase().includes(q);
        const matchComp = prod.composition?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc && !matchComp) return false;
      }

      return true;
    });
  }, [products, categories, activeCategory, activeSubcategory, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <Hero />

        {/* Category Navigation Bar */}
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          activeSubcategory={activeSubcategory}
          onSelectSubcategory={setActiveSubcategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Products Grid Section */}
        <section className="container" style={{ paddingBottom: '60px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--accent-copper)' }} />
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Загружаем ремесленные деликатесы...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-craft)',
                margin: '32px 0',
              }}
            >
              <h3 style={{ fontSize: '22px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
                В этой категории пока нет товаров
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Попробуйте сбросить фильтры или выбрать другую категорию
              </p>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveSubcategory('');
                  setSearchQuery('');
                }}
                className="btn-primary"
              >
                Показать все деликатесы
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const cartItem = cartItems.find((it) => it.product.id === product.id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={cartItem ? cartItem.quantity : 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onOpenDetails={setSelectedProduct}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* About the Maker & Production Story */}
        <section
          style={{
            background: 'var(--bg-craft)',
            borderTop: '1px solid var(--border-craft)',
            borderBottom: '1px solid var(--border-craft)',
            padding: '64px 0',
          }}
        >
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '48px',
                alignItems: 'center',
              }}
            >
              <div>
                <div className="badge-craft badge-recipe" style={{ marginBottom: '14px' }}>
                  О нашем производстве
                </div>
                <h2 style={{ fontSize: '36px', color: 'var(--bg-dark)', marginBottom: '18px' }}>
                  Честное домашнее дело в деревне Бурцево
                </h2>
                <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                  Все продукты «НЕВДАХИНЪ» готовятся вручную одним человеком — Дмитрием Невдахиным — 
                  на личном дачном участке. Здесь нет фабричных конвейеров, химических консервантов 
                  или ускоренных технологий.
                </p>
                <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                  Только отборное фермерское мясо, семейные рецептуры, настоящий автоклав для тушенки, 
                  коптильня на натуральной ольховой щепе и ручная лепка каждого пельменя.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-craft)' }}>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--accent-copper)' }}>2 км</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Радиус свежей экспресс-доставки</div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-craft)' }}>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--accent-green)' }}>100%</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Натуральное мясо без сои и химии</div>
                  </div>
                </div>
              </div>

              {/* Visual hallmarks card */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '32px',
                  border: '1px solid var(--border-craft)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <h3 style={{ fontSize: '24px', color: 'var(--bg-dark)', marginBottom: '20px' }}>
                  Наши главные принципы
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{ color: 'var(--accent-copper)', flexShrink: 0 }}>
                      <Flame size={24} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--bg-dark)' }}>Копчение на ольхе</strong>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Классическое горячее копчение на натуральной ольховой и яблоневой щепе. Никакого жидкого дыма.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{ color: 'var(--accent-green)', flexShrink: 0 }}>
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--bg-dark)' }}>ГОСТ и семейные рецепты</strong>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Точные пропорции мяса, натуральных специй, чеснока и соли. Вкус как в лучших домашних традициях.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{ color: 'var(--accent-amber)', flexShrink: 0 }}>
                      <HeartHandshake size={24} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--bg-dark)' }}>Личная ответственность мастера</strong>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Дмитрий отвечает своим именем и репутацией за каждую банку тушенки и каждое кольцо колбасы.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Bottom Bar on Mobile if Cart has items */}
      {cartCount > 0 && (
        <div className="mobile-cart-bar">
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '15px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} />
              <span>Корзина ({cartCount})</span>
            </div>
            <strong>{cartTotal} ₽</strong>
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        quantityInCart={
          selectedProduct
            ? cartItems.find((it) => it.product.id === selectedProduct.id)?.quantity || 0
            : 0
        }
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {/* Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onOrderSuccess={(order) => setCompletedOrder(order)}
      />

      {/* Order Success Confirmation Modal */}
      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
}
