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
    <>
      <div className="catalog-header-container">
        <div className="container">
          {/* Catalog Title & Search row */}
          <div className="catalog-title-row">
            <div>
              <h2 className="catalog-title">Каталог деликатесов</h2>
              <p className="catalog-subtitle">
                Только свежие партии, изготовленные вручную по семейным рецептам
              </p>
            </div>

            <div className="catalog-search-wrapper">
              <Search size={16} className="catalog-search-icon" />
              <input
                type="text"
                placeholder="Поиск по названию, составу..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="form-input catalog-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Categories Bar */}
      <div className="category-sticky-bar">
        <div className="container">
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
            <div className="subcategory-nav-list">
              <button
                onClick={() => onSelectSubcategory('')}
                className={`subcategory-nav-item ${activeSubcategory === '' ? 'active' : ''}`}
              >
                Все подкатегории
              </button>

              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubcategory(sub.slug)}
                  className={`subcategory-nav-item ${activeSubcategory === sub.slug ? 'active' : ''}`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
