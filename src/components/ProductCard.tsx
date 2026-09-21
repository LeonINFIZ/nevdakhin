'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { Plus, Minus, Check, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onOpenDetails: (product: Product) => void;
}

export default function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails,
}: ProductCardProps) {
  const imageSrc =
    product.images && product.images.length > 0
      ? product.images[0]
      : '/images/products/tushenka.jpg';

  const badgeClass =
    product.badge === 'Хит продаж' || product.badge === 'Хит'
      ? 'badge-hit'
      : product.badge === 'Семейный рецепт' || product.badge === 'ГОСТ 1936'
      ? 'badge-recipe'
      : 'badge-new';

  return (
    <div className="product-card">
      {/* Image Wrap */}
      <div className="product-card-image-wrap" onClick={() => onOpenDetails(product)}>
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="product-card-image"
          loading="lazy"
        />

        <div className="product-card-badges">
          {product.badge && (
            <span
              className={`badge-craft ${!product.badge_bg ? badgeClass : ''}`}
              style={
                product.badge_bg
                  ? {
                      backgroundColor: product.badge_bg,
                      color: product.badge_text || undefined,
                      borderColor: product.badge_border || undefined,
                    }
                  : undefined
              }
            >
              {product.badge}
            </span>
          )}
          {product.has_recipe && (
            <span
              className="badge-craft badge-recipe-indicator"
              style={{
                background: '#FFF5E6',
                color: '#9C5823',
                border: '1px solid #F5CBA7',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Для этого деликатеса доступен пошаговый рецепт приготовления"
            >
              📖 Рецепт
            </span>
          )}
          {product.in_stock === 0 && (
            <span className="badge-craft" style={{ background: '#736B63', color: '#FFFFFF' }}>
              Под заказ
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="product-card-body">
        {product.weight && (
          <div className="product-card-weight">{product.weight}</div>
        )}

        <h3
          className="product-card-title"
          onClick={() => onOpenDetails(product)}
        >
          {product.title}
        </h3>

        <p className="product-card-desc">{product.description}</p>

        {/* Footer */}
        <div className="product-card-footer">
          <div className="product-card-price-wrap">
            <span className="product-card-price">{product.price} ₽</span>
            {product.old_price && (
              <span className="product-card-old-price">{product.old_price} ₽</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-view-quick"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(product);
              }}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-craft)',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                flexShrink: 0,
              }}
              title="Быстрый просмотр и рецепт"
              aria-label="Подробнее"
            >
              <Eye size={17} />
            </button>

            {quantityInCart > 0 ? (
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                  aria-label="Уменьшить"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-num">{quantityInCart}</span>
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                  aria-label="Увеличить"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                className="btn-primary btn-add-cart"
                style={{ padding: '9px 15px', fontSize: '13px' }}
                onClick={() => onAddToCart(product)}
                disabled={product.in_stock === 0}
              >
                <Plus size={15} />
                <span>В корзину</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
