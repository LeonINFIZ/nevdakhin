'use client';

import React from 'react';
import { Order } from '@/types';
import { CheckCircle, MapPin, Truck, Phone, X } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderSuccessModal({ order, onClose }: OrderSuccessModalProps) {
  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center', padding: '32px 24px' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--bg-craft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-green-light)',
            color: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <CheckCircle size={36} />
        </div>

        <h2 style={{ fontSize: '26px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
          Заказ успешно принят!
        </h2>

        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-craft)',
            border: '1px solid var(--border-craft)',
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--accent-copper)',
            marginBottom: '18px',
          }}
        >
          Номер заказа: {order.order_number}
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
          Спасибо за заказ в нашей семейной мануфактуре! Дмитрий свяжется с вами по указанному телефону для подтверждения времени выдачи или доставки.
        </p>

        <div
          style={{
            background: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            border: '1px solid var(--border-subtle)',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {order.delivery_type === 'pickup' ? (
              <>
                <MapPin size={16} style={{ color: 'var(--accent-copper)' }} />
                <span>
                  <strong>Самовывоз:</strong> д. Бурцево, ул. Раздолье, 236/2
                </span>
              </>
            ) : (
              <>
                <Truck size={16} style={{ color: 'var(--accent-copper)' }} />
                <span>
                  <strong>Курьерская доставка:</strong> в пределах 4 км {order.delivery_distance_km ? `(${order.delivery_distance_km} км)` : ''}
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)', fontWeight: 700 }}>
            <span>Сумма к оплате при получении:</span>
            <span style={{ color: 'var(--accent-copper)', fontSize: '16px' }}>{order.total_amount} ₽</span>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>
          Вернуться к покупкам
        </button>
      </div>
    </div>
  );
}
