'use client';

import React, { useState } from 'react';
import { Category, Product, CartItem } from '@/types';
import ProductCard from './ProductCard';
import { Search, ChevronDown } from 'lucide-react';

interface MobileCategorySpoilersProps {
  categories: Category[];
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartItems: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onOpenDetails: (product: Product) => void;
}

export default function MobileCategorySpoilers({
  categories,
  products,
  searchQuery,
  onSearchChange,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails,
}: MobileCategorySpoilersProps) {
  // Initially null: user sees vertical list of categories as spoilers
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');

  const toggleCategory = (slug: string) => {
    if (expandedCategory === slug) {
      // Toggle close
      setExpandedCategory(null);
      setActiveSubcategory('');
    } else {
      // Open category, reset subcategory to all
      setExpandedCategory(slug);
      setActiveSubcategory('');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '16px', paddingBottom: '32px' }}>
      {/* Title & Subtitle */}
      <div style={{ marginBottom: '16px' }}>
        <h2 className="catalog-title" style={{ fontSize: '24px', marginBottom: '4px' }}>
          Каталог деликатесов
        </h2>
        <p className="catalog-subtitle" style={{ fontSize: '13px' }}>
          Только свежие партии, изготовленные вручную по семейным рецептам
        </p>
      </div>

      {/* Prominent Search Bar with bold border */}
      <div className="catalog-search-wrapper" style={{ maxWidth: '100%', marginBottom: '20px' }}>
        <Search size={16} className="catalog-search-icon" />
        <input
          type="text"
          placeholder="Поиск по названию, составу..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="form-input catalog-search-input"
          style={{ width: '100%' }}
        />
      </div>

      {/* Vertical list of categories as spoilers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.slug;
          const subcategories = cat.subcategories || [];

          // All products for this category
          const catProducts = products.filter((p) => p.category_id === cat.id);

          // Filtered by subcategory and search
          const displayedProducts = catProducts.filter((p) => {
            if (activeSubcategory && isExpanded) {
              const sub = subcategories.find((s) => s.slug === activeSubcategory);
              if (sub && p.subcategory_id !== sub.id) return false;
            }

            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const matchTitle = p.title.toLowerCase().includes(q);
              const matchDesc = p.description.toLowerCase().includes(q);
              const matchComp = p.composition?.toLowerCase().includes(q) || false;
              if (!matchTitle && !matchDesc && !matchComp) return false;
            }

            return true;
          });

          // Match count for search or total count
          const countBadge = searchQuery.trim() ? displayedProducts.length : catProducts.length;

          return (
            <div
              key={cat.id}
              className={`mobile-cat-spoiler ${isExpanded ? 'is-open' : ''}`}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: isExpanded ? '2px solid var(--accent-copper)' : '1.5px solid var(--border-craft)',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                boxShadow: isExpanded
                  ? '0 6px 20px rgba(194, 98, 42, 0.12)'
                  : '0 2px 6px rgba(0, 0, 0, 0.03)',
              }}
            >
              {/* Spoiler Header Button */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.slug)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: isExpanded ? 'rgba(194, 98, 42, 0.04)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: isExpanded ? 'var(--accent-copper)' : 'var(--bg-dark)',
                      lineHeight: 1.3,
                    }}
                  >
                    {cat.name}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: isExpanded ? 'var(--accent-copper)' : 'var(--bg-craft)',
                      color: isExpanded ? '#FFFFFF' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {countBadge}
                  </span>
                </div>

                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isExpanded ? 'rgba(194, 98, 42, 0.12)' : 'var(--bg-craft)',
                    color: isExpanded ? 'var(--accent-copper)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                  }}
                >
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                    }}
                  />
                </div>
              </button>

              {/* Spoiler Body */}
              {isExpanded && (
                <div
                  style={{
                    padding: '14px 14px 20px',
                    borderTop: '1px dashed var(--border-craft)',
                    background: 'linear-gradient(180deg, rgba(251, 248, 243, 0.8) 0%, #FFFFFF 100%)',
                  }}
                >
                  {/* Secondary Categories (Subcategories) under main category */}
                  {subcategories.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '12px',
                        marginBottom: '16px',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubcategory('');
                        }}
                        style={{
                          padding: '7px 15px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          background: activeSubcategory === '' ? 'var(--accent-copper)' : '#FFFFFF',
                          color: activeSubcategory === '' ? '#FFFFFF' : 'var(--text-main)',
                          border: `1px solid ${activeSubcategory === '' ? 'var(--accent-copper)' : 'var(--border-craft)'}`,
                          whiteSpace: 'nowrap',
                          boxShadow: activeSubcategory === '' ? '0 2px 8px rgba(194, 98, 42, 0.25)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Все
                      </button>

                      {subcategories.map((sub) => {
                        const isSubActive = activeSubcategory === sub.slug;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSubcategory(sub.slug);
                            }}
                            style={{
                              padding: '7px 15px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              background: isSubActive ? 'var(--accent-copper)' : '#FFFFFF',
                              color: isSubActive ? '#FFFFFF' : 'var(--text-main)',
                              border: `1px solid ${isSubActive ? 'var(--accent-copper)' : 'var(--border-craft)'}`,
                              whiteSpace: 'nowrap',
                              boxShadow: isSubActive ? '0 2px 8px rgba(194, 98, 42, 0.25)' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Products Grid inside this spoiler */}
                  {displayedProducts.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '13.5px',
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px dashed var(--border-craft)',
                      }}
                    >
                      {searchQuery.trim()
                        ? 'В этой категории нет товаров по вашему запросу'
                        : 'В этой подкатегории пока нет товаров'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {displayedProducts.map((product) => {
                        const cartItem = cartItems.find((it) => it.product.id === product.id);
                        return (
                          <ProductCard
                            key={product.id}
                            product={product}
                            quantityInCart={cartItem ? cartItem.quantity : 0}
                            onAddToCart={onAddToCart}
                            onUpdateQuantity={onUpdateQuantity}
                            onOpenDetails={onOpenDetails}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
