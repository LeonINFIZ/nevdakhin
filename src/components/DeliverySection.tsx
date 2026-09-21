'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, AlertCircle, Phone, Search, Loader2, Navigation } from 'lucide-react';

export default function DeliverySection() {
  const [addressInput, setAddressInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ value: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  const suggestTimeout = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [result, setResult] = useState<{
    formattedAddress: string;
    distanceKm: number;
    isEligible: boolean;
    deliveryCost: number;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    setAddressInput(val);
    setResult(null);

    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);

    if (val.trim().length >= 2) {
      suggestTimeout.current = setTimeout(async () => {
        try {
          setIsSearchingSuggestions(true);
          const res = await fetch(`/api/dadata/suggest?q=${encodeURIComponent(val.trim())}`);
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.suggestions || []);
            setSuggestions(list);
            setShowSuggestions(list.length > 0);
          }
        } catch {
          // ignore error
        } finally {
          setIsSearchingSuggestions(false);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const checkAddressDistance = async (addr: string) => {
    if (!addr.trim()) return;
    setChecking(true);
    setResult(null);
    setShowSuggestions(false);

    try {
      const res = await fetch('/api/dadata/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setResult({
          formattedAddress: addr,
          distanceKm: 999,
          isEligible: false,
          deliveryCost: 0,
          reason: data.error || 'Не удалось рассчитать расстояние.',
        });
      }
    } catch {
      setResult({
        formattedAddress: addr,
        distanceKm: 999,
        isEligible: false,
        deliveryCost: 0,
        reason: 'Ошибка связи с сервисом геокодирования.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSelectSuggestion = (value: string) => {
    setAddressInput(value);
    setShowSuggestions(false);
    setSuggestions([]);
    checkAddressDistance(value);
  };

  const handleCheckAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    checkAddressDistance(addressInput);
  };

  return (
    <section
      id="delivery"
      className="scroll-section"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-craft)',
        padding: '80px 0',
      }}
    >
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(58, 99, 71, 0.1)',
              border: '1px solid rgba(58, 99, 71, 0.25)',
              color: 'var(--accent-green)',
              fontWeight: 600,
              fontSize: '13px',
              marginBottom: '14px',
            }}
          >
            <Truck size={15} />
            <span>Условия получения <span className="sep-dot" /> Свежесть из первых рук</span>
          </div>

          <h2 style={{ fontSize: 'clamp(30px, 3.5vw, 42px)', color: 'var(--bg-dark)', marginBottom: '14px' }}>
            Доставка и самовывоз
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Доставляем свежие деликатесы прямо из цеха в радиусе 4 км или с радостью ждем вас в гости в деревне Бурцево.
          </p>
        </div>

        {/* 2 Options Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          {/* Card 1: Courier delivery */}
          <div
            style={{
              background: 'var(--bg-main)',
              borderRadius: '24px',
              padding: '32px',
              border: '2px solid var(--border-craft)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-craft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-copper)',
                }}
              >
                <Truck size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '22px', color: 'var(--bg-dark)' }}>Курьерская доставка</h3>
                <span style={{ fontSize: '13px', color: 'var(--accent-copper)', fontWeight: 700 }}>
                  В радиусе 4 км от производства
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-main)', marginBottom: '24px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px dashed var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Стоимость доставки:</span>
                <strong>250 ₽</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px dashed var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Бесплатная доставка:</span>
                <strong style={{ color: 'var(--accent-green)' }}>От 5 000 ₽</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px dashed var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Зона доставки:</span>
                <span>до 4 км от д. Бурцево</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Оплата:</span>
                <span>Наличными или переводом на месте</span>
              </div>
            </div>

            {/* Address Checker Widget */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid var(--border-craft)',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bg-dark)', marginBottom: '10px' }}>
                Проверить, входит ли ваш адрес в зону 4 км:
              </div>

              <form onSubmit={handleCheckAddress} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                <div style={{ position: 'relative', flex: 1 }} ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="д. Бурцево, ул. Раздолье, 10"
                    value={addressInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="form-input"
                    style={{ fontSize: '13px', padding: '9px 12px', width: '100%' }}
                  />
                  {isSearchingSuggestions && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--accent-copper)',
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  )}

                  {/* Dropdown with suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggest-dropdown" style={{ zIndex: 60 }}>
                      {suggestions.map((sug, idx) => (
                        <div
                          key={idx}
                          className="suggest-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(sug.value);
                          }}
                          onClick={() => handleSelectSuggestion(sug.value)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
                        >
                          <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-copper)' }} />
                          <span>{sug.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={checking || !addressInput.trim()}
                  className="btn-primary"
                  style={{ padding: '0 16px', fontSize: '13px', flexShrink: 0 }}
                >
                  {checking ? <Loader2 size={16} className="animate-spin" /> : 'Проверить'}
                </button>
              </form>

              {result && (
                <div style={{ marginTop: '12px' }}>
                  {result.isEligible ? (
                    <div className="distance-badge-eligible" style={{ margin: 0 }}>
                      <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Доставка доступна!</strong>
                        <div style={{ fontSize: '12px', marginTop: '2px' }}>
                          Расстояние: {result.distanceKm} км. Доставим свежую партию прямо к вашему столу.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="distance-badge-ineligible" style={{ margin: 0 }}>
                      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Адрес вне зоны курьерской доставки</strong>
                        <div style={{ fontSize: '12px', marginTop: '2px' }}>
                          Расстояние: {result.distanceKm} км (лимит — 4 км). Вы можете оформить «Самовывоз» или связаться с Дмитрием лично.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Self-pickup */}
          <div
            style={{
              background: 'var(--bg-main)',
              borderRadius: '24px',
              padding: '32px',
              border: '2px solid var(--border-craft)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-craft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-green)',
                }}
              >
                <MapPin size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '22px', color: 'var(--bg-dark)' }}>Самовывоз из цеха</h3>
                <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 700 }}>
                  Бесплатно в любой день
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: 'var(--text-main)', marginBottom: '24px', flex: 1 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px', marginBottom: '4px' }}>
                  Точный адрес производства:
                </span>
                <strong style={{ fontSize: '15px' }}>
                  Нижегородская обл., Богородский м.о., деревня Бурцево, улица Раздолье, 236/2
                </strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Координаты: 56.131897, 43.743571
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--bg-dark)' }}>
                  Как получить заказ:
                </div>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Оформите заказ на сайте, выбрав «Самовывоз». Дмитрий соберет и бережно упакует деликатесы к назначенному времени и встретит вас на месте.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="https://yandex.ru/maps/?text=56.131897,43.743571"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ flex: 1, padding: '12px 16px', fontSize: '14px' }}
              >
                <Navigation size={16} style={{ color: 'var(--accent-copper)' }} />
                <span>Маршрут на Яндекс.Картах</span>
              </a>

              <a
                href="tel:+79200000000"
                className="btn-primary"
                style={{ flex: 1, padding: '12px 16px', fontSize: '14px' }}
              >
                <Phone size={16} />
                <span>Позвонить мастеру</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
