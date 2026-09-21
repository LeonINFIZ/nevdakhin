'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Order, DeliveryType } from '@/types';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Loader2,
  Clock,
} from 'lucide-react';

interface DaDataSuggestion {
  value: string;
  unrestricted_value: string;
  data: {
    geo_lat: string | null;
    geo_lon: string | null;
    city: string | null;
    street: string | null;
    house: string | null;
  };
}

export default function CartPage() {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  // Form states
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderComment, setOrderComment] = useState('');

  // Address geocoding states
  const [suggestions, setSuggestions] = useState<DaDataSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<{
    formattedAddress: string;
    distanceKm: number;
    isEligible: boolean;
    deliveryCost: number;
    reason?: string;
  } | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autocomplete address using DaData
  const handleAddressChange = (text: string) => {
    setCustomerAddress(text);
    setDistanceInfo(null);

    if (suggestDebounceRef.current) {
      clearTimeout(suggestDebounceRef.current);
    }

    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    suggestDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const res = await fetch('/api/dadata/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text }),
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error('DaData suggest error:', err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (suggestion: DaDataSuggestion) => {
    setCustomerAddress(suggestion.value);
    setSuggestions([]);
    calculateDistanceForAddress(suggestion.value);
  };

  const calculateDistanceForAddress = async (address: string) => {
    if (!address.trim()) return;
    try {
      setIsCalculatingDistance(true);
      const res = await fetch('/api/dadata/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (res.ok) {
        setDistanceInfo(data);
      } else {
        setDistanceInfo({
          formattedAddress: address,
          distanceKm: 999,
          isEligible: false,
          deliveryCost: 0,
          reason: data.error || 'Не удалось рассчитать расстояние.',
        });
      }
    } catch {
      setDistanceInfo({
        formattedAddress: address,
        distanceKm: 999,
        isEligible: false,
        deliveryCost: 0,
        reason: 'Ошибка связи с геосервисом.',
      });
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  // Delivery calculation
  const deliveryFee =
    deliveryType === 'pickup'
      ? 0
      : cartTotal >= 5000
      ? 0
      : distanceInfo?.isEligible
      ? distanceInfo.deliveryCost || 250
      : 250;

  const finalTotal = cartTotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!customerName.trim()) {
      setSubmitError('Пожалуйста, укажите ваше имя.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setSubmitError('Пожалуйста, укажите контактный номер телефона.');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!customerAddress.trim()) {
        setSubmitError('Пожалуйста, укажите адрес доставки.');
        return;
      }
      if (distanceInfo && !distanceInfo.isEligible) {
        setSubmitError(
          'Указанный адрес находится вне зоны курьерской доставки (лимит — 4 км от деревни Бурцево). Пожалуйста, выберите «Самовывоз» или укажите другой адрес.'
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_type: deliveryType,
        delivery_address:
          deliveryType === 'delivery'
            ? distanceInfo?.formattedAddress || customerAddress.trim()
            : 'Самовывоз: д. Бурцево, ул. Раздолье, 236/2',
        delivery_distance_km: deliveryType === 'delivery' ? distanceInfo?.distanceKm || null : 0,
        delivery_cost: deliveryFee,
        items_cost: cartTotal,
        total_cost: finalTotal,
        customer_comment: orderComment.trim() || null,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          weight: item.product.weight || '',
        })),
        payment_method: 'cash_or_transfer',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Ошибка при сохранении заказа');
      }

      const orderData = await res.json();
      setCompletedOrder(orderData);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка при отправке заказа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation View
  if (completedOrder) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
        <Header />
        <main className="container" style={{ flex: 1, padding: '48px 16px', maxWidth: '720px' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '40px 24px',
              border: '2px solid var(--border-craft)',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--accent-green-light)',
                border: '2px solid #9FD4AC',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <div className="badge-craft badge-recipe" style={{ marginBottom: '12px' }}>
              Заказ успешно оформлен
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(26px, 4vw, 34px)',
                color: 'var(--bg-dark)',
                marginBottom: '12px',
              }}
            >
              Спасибо за ваш заказ {completedOrder.order_number || `#${completedOrder.id}`}!
            </h1>

            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Дмитрий уже получил ваше обращение. В ближайшее время мастер свяжется с вами по номеру{' '}
              <strong>{completedOrder.customer_phone}</strong> для подтверждения удобного времени доставки или выдачи.
            </p>

            <div
              style={{
                background: 'var(--bg-main)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--border-craft)',
                textAlign: 'left',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Получатель:</span>
                <strong>{completedOrder.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Способ получения:</span>
                <strong>
                  {completedOrder.delivery_type === 'delivery' ? 'Курьерская доставка (до 4 км)' : 'Самовывоз из цеха'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Адрес:</span>
                <span style={{ textAlign: 'right', maxWidth: '300px', fontWeight: 600 }}>
                  {completedOrder.delivery_address}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Оплата:</span>
                <span>При получении (наличными или переводом)</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px dashed var(--border-craft)',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--bg-dark)',
                }}
              >
                <span>Итого к оплате:</span>
                <span style={{ color: 'var(--accent-copper)' }}>{completedOrder.total_amount || finalTotal} ₽</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/" className="btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
                <ArrowLeft size={16} />
                <span>Вернуться на главную</span>
              </Link>
              <a href="tel:+79200000000" className="btn-secondary" style={{ padding: '12px 20px', fontSize: '14px' }}>
                <Phone size={16} style={{ color: 'var(--accent-copper)' }} />
                <span>Позвонить мастеру</span>
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <Header />

      <main className="container" style={{ flex: 1, padding: '32px 16px 80px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Вернуться в каталог деликатесов</span>
          </Link>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              color: 'var(--bg-dark)',
              lineHeight: 1.15,
            }}
          >
            Корзина и оформление заказа
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Прямые поставки от мастера Дмитрия Невдахина из деревни Бурцево
          </p>
        </div>

        {/* Empty State */}
        {cartItems.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '60px 24px',
              border: '2px solid var(--border-craft)',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'var(--bg-craft)',
                border: '1px dashed var(--border-craft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: 'var(--accent-copper)',
              }}
            >
              <ShoppingBag size={30} />
            </div>
            <h2 style={{ fontSize: '22px', color: 'var(--bg-dark)', marginBottom: '8px' }}>
              В вашей корзине пока пусто
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Загляните в наш каталог: свежая партия тушенки длительного томления в автоклаве, ароматная краковская колбаса
              и сочные пельмени ручной лепки ждут вас!
            </p>
            <Link href="/#catalog" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>
              <Sparkles size={16} />
              <span>Перейти к выбору деликатесов</span>
            </Link>
          </div>
        ) : (
          /* Active Cart Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.95fr)',
              gap: '32px',
              alignItems: 'flex-start',
            }}
            className="cart-grid"
          >
            {/* Left Column: Items List & Order Form */}
            <div>
              {/* 1. Products List Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid var(--border-craft)',
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <h2 style={{ fontSize: '19px', color: 'var(--bg-dark)' }}>
                    Выбранные деликатесы ({cartCount} шт.)
                  </h2>
                  <button
                    onClick={clearCart}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Очистить</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cartItems.map((item) => {
                    const img =
                      item.product.images && item.product.images.length > 0
                        ? item.product.images[0]
                        : '/images/products/tushenka.jpg';

                    return (
                      <div
                        key={item.product.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          paddingBottom: '14px',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                        className="cart-item-row"
                      >
                        {/* Image */}
                        <div
                          style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            flexShrink: 0,
                            background: '#EAE1D3',
                            border: '1px solid var(--border-craft)',
                          }}
                        >
                          <Image
                            src={img}
                            alt={item.product.title}
                            fill
                            sizes="70px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>

                        {/* Title & info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: '15px',
                              fontWeight: 700,
                              color: 'var(--bg-dark)',
                              marginBottom: '2px',
                              lineHeight: 1.3,
                            }}
                          >
                            {item.product.title}
                          </h3>
                          {item.product.weight && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {item.product.weight}
                            </span>
                          )}
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-copper)', marginTop: '2px' }}>
                            {item.product.price} ₽
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid var(--border-craft)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-main)',
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            style={{
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-main)',
                            }}
                            aria-label="Уменьшить"
                          >
                            <Minus size={13} />
                          </button>
                          <span
                            style={{
                              width: '26px',
                              textAlign: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            style={{
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-main)',
                            }}
                            aria-label="Увеличить"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div
                          style={{
                            width: '74px',
                            textAlign: 'right',
                            fontWeight: 700,
                            fontSize: '15px',
                            color: 'var(--bg-dark)',
                          }}
                        >
                          {item.product.price * item.quantity} ₽
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          aria-label="Удалить товар"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Delivery & Details Form Card */}
              <form onSubmit={handleSubmitOrder}>
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '24px',
                    border: '1px solid var(--border-craft)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '20px',
                  }}
                >
                  <h2 style={{ fontSize: '19px', color: 'var(--bg-dark)', marginBottom: '16px' }}>
                    1. Способ получения
                  </h2>

                  {/* Delivery Mode Tabs */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        border:
                          deliveryType === 'delivery'
                            ? '2px solid var(--accent-copper)'
                            : '1px solid var(--border-craft)',
                        background: deliveryType === 'delivery' ? '#FFF9F5' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          color: deliveryType === 'delivery' ? 'var(--accent-copper)' : 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        <Truck size={18} />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--bg-dark)' }}>
                          Курьерская доставка
                        </strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          В радиусе 4 км • 250 ₽ (от 5 000 ₽ бесплатно)
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        border:
                          deliveryType === 'pickup'
                            ? '2px solid var(--accent-green)'
                            : '1px solid var(--border-craft)',
                        background: deliveryType === 'pickup' ? '#F4FAF5' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          color: deliveryType === 'pickup' ? 'var(--accent-green)' : 'var(--text-muted)',
                          marginTop: '2px',
                        }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px', color: 'var(--bg-dark)' }}>
                          Самовывоз из цеха
                        </strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          д. Бурцево, Раздолье, 236/2 • Бесплатно
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Courier Delivery Fields */}
                  {deliveryType === 'delivery' ? (
                    <div style={{ marginBottom: '18px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--bg-dark)',
                          marginBottom: '6px',
                        }}
                      >
                        Адрес доставки (до 4 км от деревни Бурцево) *
                      </label>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          onBlur={() => {
                            setTimeout(() => {
                              if (customerAddress && !distanceInfo) {
                                calculateDistanceForAddress(customerAddress);
                              }
                            }, 200);
                          }}
                          placeholder="Начните вводить адрес (д. Бурцево, Окский берег, Доскино...)"
                          className="form-input"
                          style={{ paddingRight: '40px' }}
                        />
                        {isSearchingAddress || isCalculatingDistance ? (
                          <div
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--accent-copper)',
                            }}
                          >
                            <Loader2 size={18} className="animate-spin" />
                          </div>
                        ) : null}

                        {/* DaData Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                          <div className="suggest-dropdown">
                            {suggestions.map((sug, idx) => (
                              <div
                                key={idx}
                                className="suggest-item"
                                onClick={() => handleSelectSuggestion(sug)}
                              >
                                {sug.value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Distance status badge */}
                      {distanceInfo && (
                        <div>
                          {distanceInfo.isEligible ? (
                            <div className="distance-badge-eligible">
                              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div>
                                <strong>Адрес входит в зону доставки!</strong>
                                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                  Расстояние: {distanceInfo.distanceKm} км от производства.
                                  {cartTotal >= 5000
                                    ? ' Доставка бесплатная (заказ от 5 000 ₽)!'
                                    : ' Стоимость доставки: 250 ₽.'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="distance-badge-ineligible">
                              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div>
                                <strong>Адрес вне зоны доставки (лимит 4 км)</strong>
                                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                  Расстояние: {distanceInfo.distanceKm} км. Курьер доставляет в пределах 4 км. Вы можете выбрать вариант «Самовывоз» или согласовать заказ с Дмитрием по телефону.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Self pickup banner */
                    <div
                      style={{
                        background: 'var(--bg-main)',
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-craft)',
                        fontSize: '13px',
                        marginBottom: '18px',
                      }}
                    >
                      <strong style={{ display: 'block', color: 'var(--bg-dark)', marginBottom: '4px' }}>
                        Точный адрес мастерской:
                      </strong>
                      <div style={{ color: 'var(--text-main)', marginBottom: '4px' }}>
                        Нижегородская обл., Богородский м.о., деревня Бурцево, улица Раздолье, 236/2
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Дмитрий свяжется с вами, чтобы собрать заказ к вашему приезду. Оплата на месте.
                      </div>
                    </div>
                  )}

                  <h2 style={{ fontSize: '19px', color: 'var(--bg-dark)', margin: '22px 0 14px' }}>
                    2. Контактные данные
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                        Ваше имя *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Например, Александр"
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                        Номер телефона *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+7 (900) 000-00-00"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      Пожелания к заказу / удобное время
                    </label>
                    <textarea
                      rows={2}
                      value={orderComment}
                      onChange={(e) => setOrderComment(e.target.value)}
                      placeholder="Например: позвоните за 30 минут, положи банку потушнее..."
                      className="form-textarea"
                    />
                  </div>

                  <h2 style={{ fontSize: '19px', color: 'var(--bg-dark)', margin: '22px 0 14px' }}>
                    3. Способ оплаты
                  </h2>

                  <div
                    style={{
                      background: '#FFFDF9',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      border: '1px solid var(--border-craft)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <ShieldCheck size={20} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                    <div style={{ fontSize: '13px' }}>
                      <strong>Оплата при получении</strong> — наличными или банковским переводом мастеру Дмитрию после проверки деликатесов.
                    </div>
                  </div>

                  {submitError && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent-red-light)',
                        border: '1px solid #F5B8B8',
                        color: 'var(--accent-red)',
                        fontSize: '13px',
                      }}
                    >
                      {submitError}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary Card (Sticky) */}
            <div style={{ position: 'sticky', top: '90px' }} className="cart-summary-col">
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '2px solid var(--border-craft)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <h3 style={{ fontSize: '19px', color: 'var(--bg-dark)', marginBottom: '16px' }}>
                  Ваш заказ
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Деликатесы ({cartCount} шт.):</span>
                    <strong>{cartTotal} ₽</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Доставка:</span>
                    <strong>
                      {deliveryFee === 0 ? (
                        <span style={{ color: 'var(--accent-green)' }}>Бесплатно</span>
                      ) : (
                        `${deliveryFee} ₽`
                      )}
                    </strong>
                  </div>

                  {deliveryType === 'delivery' && cartTotal < 5000 && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--accent-copper)',
                        background: '#FFF4EE',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Добавьте товаров еще на {5000 - cartTotal} ₽ для бесплатной доставки!
                    </div>
                  )}

                  <div
                    style={{
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-craft)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                      Итого к оплате:
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '26px',
                        fontWeight: 700,
                        color: 'var(--accent-copper)',
                      }}
                    >
                      {finalTotal} ₽
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || (deliveryType === 'delivery' && distanceInfo !== null && !distanceInfo.isEligible)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '15px',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    `Оформить заказ (${finalTotal} ₽)`
                  )}
                </button>

                {/* Craft trust points */}
                <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={15} style={{ color: 'var(--accent-green)' }} />
                    <span>100% ручное домашнее производство</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} style={{ color: 'var(--accent-amber)' }} />
                    <span>Быстрая связь от мастера после оформления</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        @media (max-width: 900px) {
          .cart-grid {
            grid-template-columns: 1fr !important;
          }
          .cart-summary-col {
            position: static !important;
            margin-top: 20px;
          }
        }
        @media (max-width: 600px) {
          .cart-item-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
