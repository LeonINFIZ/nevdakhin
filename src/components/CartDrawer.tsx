'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { CartItem, DeliveryType, Order } from '@/types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Truck,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Banknote,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onClearCart,
  onOrderSuccess,
}: CartDrawerProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card_on_delivery'>('cash_on_delivery');

  // Address suggestions and geocoding state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCheckingDistance, setIsCheckingDistance] = useState(false);
  const [distanceResult, setDistanceResult] = useState<{
    formattedAddress: string;
    distanceKm: number;
    isEligible: boolean;
    deliveryCost: number;
    reason?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const suggestTimeout = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subtotal calculation
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const FREE_DELIVERY_THRESHOLD = 5000;
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  // Delivery cost
  const deliveryCost =
    deliveryType === 'delivery' && distanceResult && distanceResult.isEligible
      ? subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : distanceResult.deliveryCost
      : 0;

  const totalAmount = subtotal + deliveryCost;

  // Handle address input with debounce for DaData suggestions
  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    setDistanceResult(null);
    setErrorMessage('');

    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);

    if (value.trim().length >= 2) {
      suggestTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/dadata/suggest?q=${encodeURIComponent(value)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
          }
        } catch {
          // ignore error
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Check distance when user selects suggestion or clicks verify
  const verifyAddressDistance = async (selectedAddress: string) => {
    setShowSuggestions(false);
    setAddressInput(selectedAddress);
    setIsCheckingDistance(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/dadata/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: selectedAddress, subtotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setDistanceResult(data);
      } else {
        setErrorMessage(data.error || 'Ошибка проверки адреса');
      }
    } catch {
      setErrorMessage('Не удалось проверить адрес. Попробуйте еще раз.');
    } finally {
      setIsCheckingDistance(false);
    }
  };

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Submit order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Пожалуйста, заполните имя и телефон');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!addressInput.trim()) {
        setErrorMessage('Укажите адрес доставки');
        return;
      }
      if (!distanceResult || !distanceResult.isEligible) {
        setErrorMessage(
          'Доставка курьером возможна только в радиусе 4 км от производства. Выберите «Самовывоз» или укажите адрес в пределах 4 км.'
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_comment: customerComment,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? distanceResult?.formattedAddress || addressInput : undefined,
        payment_method: paymentMethod,
        items: cartItems.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка оформления заказа');
      }

      onClearCart();
      onClose();
      onOrderSuccess(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Произошла ошибка при оформлении');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-main)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '24px', color: 'var(--bg-dark)' }}>Корзина заказа</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {cartItems.length > 0
                ? `${cartItems.length} поз. на сумму ${subtotal} ₽`
                : 'Ваша корзина пуста'}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid var(--border-craft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Delivery Bar */}
        {subtotal > 0 && deliveryType === 'delivery' && (
          <div
            style={{
              background: remainingForFreeDelivery === 0 ? 'var(--accent-green-light)' : 'var(--bg-craft)',
              padding: '10px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '13px',
              color: remainingForFreeDelivery === 0 ? 'var(--accent-green)' : 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} />
            {remainingForFreeDelivery === 0 ? (
              <span style={{ fontWeight: 600 }}>Вам доступна бесплатная доставка курьером!</span>
            ) : (
              <span>
                До бесплатной доставки добавьте деликатесов еще на{' '}
                <strong>{remainingForFreeDelivery} ₽</strong>
              </span>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--bg-craft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--accent-copper)',
                }}
              >
                <PackageCheck size={28} />
              </div>
              <h3 style={{ fontSize: '20px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
                В корзине пока ничего нет
              </h3>
              <p style={{ fontSize: '14px', marginBottom: '24px' }}>
                Выберите настоящие домашние консервы, колбасы или копчености из каталога
              </p>
              <button onClick={onClose} className="btn-primary">
                Перейти к каталогу
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder}>
              {/* Items List */}
              <div style={{ marginBottom: '24px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                  }}
                >
                  Выбранные деликатесы
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cartItems.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        background: 'var(--bg-main)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '54px',
                          height: '54px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: '#EAE1D3',
                        }}
                      >
                        <Image
                          src={product.images[0] || '/images/products/tushenka.jpg'}
                          alt={product.title}
                          fill
                          sizes="54px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {product.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {product.weight && <span>{product.weight} • </span>}
                          <strong>{product.price} ₽</strong>
                        </div>
                      </div>

                      {/* Quantity buttons */}
                      <div className="qty-control" style={{ transform: 'scale(0.9)' }}>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="qty-num">{quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(product.id, 0)}
                        style={{
                          color: '#B0A294',
                          padding: '6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Type Selector */}
              <div style={{ marginBottom: '24px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                  }}
                >
                  Способ получения
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      border:
                        deliveryType === 'pickup'
                          ? '2px solid var(--accent-copper)'
                          : '1px solid var(--border-craft)',
                      background: deliveryType === 'pickup' ? 'var(--bg-craft)' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                      <MapPin size={16} style={{ color: 'var(--accent-copper)' }} />
                      <span>Самовывоз</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>
                      Бесплатно (д. Бурцево)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      border:
                        deliveryType === 'delivery'
                          ? '2px solid var(--accent-copper)'
                          : '1px solid var(--border-craft)',
                      background: deliveryType === 'delivery' ? 'var(--bg-craft)' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                      <Truck size={16} style={{ color: 'var(--accent-copper)' }} />
                      <span>Доставка до двери</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Радиус 4 км • 250 ₽
                    </span>
                  </button>
                </div>
              </div>

              {/* Delivery Details Block */}
              {deliveryType === 'pickup' ? (
                <div
                  style={{
                    background: 'var(--bg-craft)',
                    border: '1px solid var(--border-craft)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '4px' }}>
                    Адрес цеха выдачи:
                  </div>
                  <div style={{ color: 'var(--text-main)', marginBottom: '6px' }}>
                    Нижегородская обл., Богородский м.о., д. Бурцево, ул. Раздолье, 236/2
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Заказ будет собран к вашему визиту. Мастер свяжется с вами по готовности.
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
                    <label className="form-label">
                      Адрес доставки в радиусе 4 км (улица, дом):
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Например: д. Бурцево, ул. Раздолье, 15"
                        value={addressInput}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className="form-input"
                        autoComplete="off"
                        required={deliveryType === 'delivery'}
                      />
                      <button
                        type="button"
                        onClick={() => verifyAddressDistance(addressInput)}
                        disabled={!addressInput || isCheckingDistance}
                        className="btn-secondary"
                        style={{ padding: '0 16px', flexShrink: 0 }}
                      >
                        {isCheckingDistance ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          'Проверить'
                        )}
                      </button>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="suggest-dropdown">
                        {suggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            className="suggest-item"
                            onClick={() => verifyAddressDistance(sug.value)}
                          >
                            <MapPin size={13} style={{ display: 'inline', marginRight: '6px', color: 'var(--accent-copper)' }} />
                            {sug.value}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Geocode Distance Result Banner */}
                    {distanceResult && (
                      <div>
                        {distanceResult.isEligible ? (
                          <div className="distance-badge-eligible">
                            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Адрес входит в зону доставки!</strong>
                              <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                Расстояние: {distanceResult.distanceKm} км от производства.
                                {subtotal >= FREE_DELIVERY_THRESHOLD ? (
                                  <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                                    {' '}Доставка БЕСПЛАТНАЯ (заказ от 5 000 ₽)
                                  </span>
                                ) : (
                                  <span> Стоимость доставки: 250 ₽</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="distance-badge-ineligible">
                            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Вне зоны доставки (более 4 км)</strong>
                              <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                Расстояние до указанного адреса: {distanceResult.distanceKm} км.
                                Наш цех доставляет заказы в радиусе 4 км. Рекомендуем переключиться на{' '}
                                <button
                                  type="button"
                                  onClick={() => setDeliveryType('pickup')}
                                  style={{
                                    textDecoration: 'underline',
                                    fontWeight: 700,
                                    color: 'var(--accent-copper)',
                                  }}
                                >
                                  Самовывоз
                                </button>{' '}
                                или позвонить мастеру напрямую.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                  }}
                >
                  Контактные данные
                </h4>

                <div className="form-group">
                  <label className="form-label">Ваше имя *</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Иван"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Номер телефона для подтверждения *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 (900) 000-00-00"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Комментарий к заказу (пожелания, время)</label>
                  <textarea
                    rows={2}
                    placeholder="Например: позвоните за 30 минут"
                    value={customerComment}
                    onChange={(e) => setCustomerComment(e.target.value)}
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '24px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                  }}
                >
                  Способ оплаты
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_on_delivery')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        paymentMethod === 'cash_on_delivery'
                          ? '2px solid var(--accent-copper)'
                          : '1px solid var(--border-craft)',
                      background: paymentMethod === 'cash_on_delivery' ? 'var(--bg-craft)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Banknote size={18} style={{ color: 'var(--accent-copper)' }} />
                    <span>Наличными при получении</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card_on_delivery')}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        paymentMethod === 'card_on_delivery'
                          ? '2px solid var(--accent-copper)'
                          : '1px solid var(--border-craft)',
                      background: paymentMethod === 'card_on_delivery' ? 'var(--bg-craft)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <CreditCard size={18} style={{ color: 'var(--accent-copper)' }} />
                    <span>Переводом / картой на месте</span>
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  * Оплата производится на месте при получении заказа. В дальнейшем будет доступна онлайн-оплата на сайте.
                </div>
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div
                  style={{
                    background: 'var(--accent-red-light)',
                    color: 'var(--accent-red)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #F6BEBE',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Summary and Submit Button */}
              <div
                style={{
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  border: '1px solid var(--border-craft)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Сумма деликатесов:</span>
                  <span style={{ fontWeight: 600 }}>{subtotal} ₽</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Доставка:</span>
                  <span style={{ fontWeight: 600 }}>
                    {deliveryType === 'pickup'
                      ? 'Бесплатно'
                      : deliveryCost === 0
                      ? 'Бесплатно (от 5 000 ₽)'
                      : `${deliveryCost} ₽`}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px dashed var(--border-craft)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--bg-dark)',
                  }}
                >
                  <span>Итого к оплате:</span>
                  <span style={{ color: 'var(--accent-copper)' }}>{totalAmount} ₽</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (deliveryType === 'delivery' && (!distanceResult || !distanceResult.isEligible))}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  opacity: (deliveryType === 'delivery' && (!distanceResult || !distanceResult.isEligible)) ? 0.6 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Оформление заказа...</span>
                  </>
                ) : (
                  <span>Подтвердить заказ • {totalAmount} ₽</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
