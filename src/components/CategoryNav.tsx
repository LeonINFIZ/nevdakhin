'use client';

import React from 'react';
import { Category, Subcategory } from '@/types';
import { Search } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  activeSubcategory: string;
  onSelectSubcategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function CategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
  activeSubcategory,
  onSelectSubcategory,
  searchQuery,
  onSearchChange,
}: CategoryNavProps) {
  const currentCat = categories.find((c) => c.slug === activeCategory);
  const subcategories: Subcategory[] = currentCat?.subcategories || [];

  return (
    <div className="category-nav-wrapper scroll-section" id="catalog">
      <div className="container">
        {/* Search & Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ fontSize: '28px', color: 'var(--bg-dark)' }}>Каталог деликатесов</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Только свежие партии, изготовленные вручную по семейным рецептам
            </p>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Поиск по названию, составу..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Main Categories Pills */}
        <div className="category-nav-list">
          <button
            onClick={() => {
              onSelectCategory('all');
              onSelectSubcategory('');
            }}
            className={`category-nav-item ${activeCategory === 'all' ? 'active' : ''}`}
          >
            Все деликатесы
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.slug);
                onSelectSubcategory('');
              }}
              className={`category-nav-item ${activeCategory === cat.slug ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategories Pills if any */}
        {subcategories.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingTop: '8px',
              borderTop: '1px dashed var(--border-subtle)',
              marginTop: '8px',
            }}
          >
            <button
              onClick={() => onSelectSubcategory('')}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                background: activeSubcategory === '' ? 'var(--bg-dark)' : 'transparent',
                color: activeSubcategory === '' ? '#FFFFFF' : 'var(--text-muted)',
                border: activeSubcategory === '' ? '1px solid var(--bg-dark)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              Все подкатегории
            </button>

            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSelectSubcategory(sub.slug)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: activeSubcategory === sub.slug ? 'var(--accent-copper)' : 'transparent',
                  color: activeSubcategory === sub.slug ? '#FFFFFF' : 'var(--text-muted)',
                  border: activeSubcategory === sub.slug ? '1px solid var(--accent-copper)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
