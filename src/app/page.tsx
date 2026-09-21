'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryNav from '@/components/CategoryNav';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import AboutMaster from '@/components/AboutMaster';
import DeliverySection from '@/components/DeliverySection';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Category, Product } from '@/types';
import { ShoppingBag, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart from global context
  const { cartItems, cartCount, cartTotal, addToCart, updateQuantity } = useCart();

  // Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
  }, []);

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
      <Header />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <Hero />

        {/* Catalog Section with sticky categories bar spanning all products */}
        <section id="catalog" className="scroll-section" style={{ paddingBottom: '60px' }}>
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            activeSubcategory={activeSubcategory}
            onSelectSubcategory={setActiveSubcategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Products Grid */}
          <div className="container" style={{ marginTop: '24px' }}>
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
                      onAddToCart={addToCart}
                      onUpdateQuantity={updateQuantity}
                      onOpenDetails={setSelectedProduct}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* About the Master Dmitry Nevdakhin & Story */}
        <AboutMaster />

        {/* Delivery Terms & Distance Checker */}
        <DeliverySection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Bottom Bar on Mobile if Cart has items */}
      {cartCount > 0 && (
        <div className="mobile-cart-bar">
          <Link
            href="/cart"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '15px',
              boxShadow: '0 8px 24px rgba(194, 98, 42, 0.45)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} />
              <span>Перейти в корзину ({cartCount})</span>
            </div>
            <strong>{cartTotal} ₽ →</strong>
          </Link>
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
        onAddToCart={addToCart}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  );
}
