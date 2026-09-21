'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { X, ShieldCheck, Thermometer, Plus, Minus, ShoppingBag } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

export default function ProductModal({
  product,
  onClose,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
}: ProductModalProps) {
  if (!product) return null;

  const imageSrc =
    product.images && product.images.length > 0
      ? product.images[0]
      : '/images/products/tushenka.jpg';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Image */}
        <div style={{ position: 'relative', width: '100%', height: '300px', background: '#EAE2D5' }}>
          <Image
            src={imageSrc}
            alt={product.title}
            fill
            sizes="600px"
            style={{ objectFit: 'cover' }}
          />
          {product.badge && (
            <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
              <span className="badge-craft badge-hit">{product.badge}</span>
            </div>
          )}
        </div>

        {/* Modal Details */}
        <div style={{ padding: '24px' }}>
          {product.weight && (
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              ФАСОВКА: {product.weight}
            </div>
          )}

          <h2 style={{ fontSize: '28px', color: 'var(--bg-dark)', marginBottom: '12px' }}>
            {product.title}
          </h2>

          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
            {product.description}
          </p>

          {/* Composition Box */}
          {product.composition && (
            <div
              style={{
                background: 'var(--bg-craft)',
                border: '1px solid var(--border-craft)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--accent-copper)', marginBottom: '6px' }}>
                <ShieldCheck size={16} />
                <span>ЧЕСТНЫЙ РЕМЕСЛЕННЫЙ СОСТАВ:</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {product.composition}
              </div>
            </div>
          )}

          {/* Storage box */}
          {product.storage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginBottom: '24px',
              }}
            >
              <Thermometer size={16} style={{ color: 'var(--accent-amber)' }} />
              <span>Хранение: {product.storage}</span>
            </div>
          )}

          {/* Footer Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                {product.price} ₽
              </div>
              {product.old_price && (
                <div style={{ fontSize: '14px', textDecoration: 'line-through', color: '#998D80' }}>
                  {product.old_price} ₽
                </div>
              )}
            </div>

            {quantityInCart > 0 ? (
              <div className="qty-control" style={{ transform: 'scale(1.15)' }}>
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                >
                  <Minus size={14} />
                </button>
                <span className="qty-num">{quantityInCart}</span>
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                className="btn-primary"
                onClick={() => onAddToCart(product)}
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                <ShoppingBag size={18} />
                <span>Добавить в заказ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
