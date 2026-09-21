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
            <span className={`badge-craft ${badgeClass}`}>{product.badge}</span>
          )}
          {product.in_stock === 0 && (
            <span className="badge-craft" style={{ background: '#736B63', color: '#FFFFFF' }}>
              Под заказ
            </span>
          )}
        </div>

        {/* Quick view hover icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(product);
          }}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Подробнее о составе"
        >
          <Eye size={16} />
        </button>
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
              className="btn-primary"
              style={{ padding: '9px 16px', fontSize: '13px' }}
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
  );
}
