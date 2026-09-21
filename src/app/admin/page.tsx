'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category, Product, Order, OrderStatus } from '@/types';
import {
  ShoppingBag,
  Package,
  Layers,
  Settings,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Phone,
  Search,
  Upload,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChefHat,
  Tag,
  Sparkles,
} from 'lucide-react';
import { transliterateToSlug } from '@/lib/slug';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'settings'>('orders');
  const [loading, setLoading] = useState(true);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productBadgeFilter, setProductBadgeFilter] = useState<string>('all');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    title: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    old_price: '',
    weight: '',
    description: '',
    composition: '',
    storage: '',
    badge: '',
    in_stock: 1,
    images: [] as string[],
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    subcategories: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Check auth and load initial data
  useEffect(() => {
    async function init() {
      try {
        const checkRes = await fetch('/api/admin/check');
        const checkData = await checkRes.json();
        if (!checkData.authenticated) {
          router.push('/admin/login');
          return;
        }

        await reloadData();
      } catch (err) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const reloadData = async () => {
    try {
      const [ordRes, prodRes, catRes, setRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products?admin=1'),
        fetch('/api/categories'),
        fetch('/api/settings'),
      ]);

      if (ordRes.ok) setOrders(await ordRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (setRes.ok) setSettings(await setRes.json());
    } catch (err) {
      console.error('Error reloading data:', err);
    }
  };

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3500);
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showNotification(`Статус заказа обновлен на «${getStatusLabel(newStatus)}»`);
        reloadData();
      }
    } catch {
      setActionError('Не удалось обновить статус');
    }
  };

  // Product modal open
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        title: product.title,
        category_id: String(product.category_id),
        subcategory_id: product.subcategory_id ? String(product.subcategory_id) : '',
        price: String(product.price),
        old_price: product.old_price ? String(product.old_price) : '',
        weight: product.weight || '',
        description: product.description || '',
        composition: product.composition || '',
        storage: product.storage || '',
        badge: product.badge || '',
        in_stock: product.in_stock,
        images: product.images || [],
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        title: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        subcategory_id: '',
        price: '',
        old_price: '',
        weight: '',
        description: '',
        composition: '',
        storage: '',
        badge: '',
        in_stock: 1,
        images: ['/images/products/tushenka.jpg'],
      });
    }
    setIsProductModalOpen(true);
  };

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.urls) {
        setProductFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...data.urls],
        }));
        showNotification('Фотография успешно загружена');
      } else {
        setActionError(data.error || 'Ошибка загрузки');
      }
    } catch {
      setActionError('Ошибка загрузки фото');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: productFormData.title,
        category_id: parseInt(productFormData.category_id, 10),
        subcategory_id: productFormData.subcategory_id ? parseInt(productFormData.subcategory_id, 10) : null,
        price: parseFloat(productFormData.price),
        old_price: productFormData.old_price ? parseFloat(productFormData.old_price) : null,
        weight: productFormData.weight,
        description: productFormData.description,
        composition: productFormData.composition,
        storage: productFormData.storage,
        badge: productFormData.badge || null,
        in_stock: productFormData.in_stock,
        images: productFormData.images,
      };

      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showNotification('Деликатес успешно обновлен');
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showNotification('Новый деликатес добавлен в каталог');
      }

      setIsProductModalOpen(false);
      reloadData();
    } catch (err) {
      setActionError('Ошибка сохранения деликатеса');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Вы действительно хотите удалить этот товар из каталога?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      showNotification('Товар удален');
      reloadData();
    } catch {
      setActionError('Ошибка удаления товара');
    }
  };

  // Category modal open (create or edit)
  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        subcategories: (category.subcategories || []).map((s) => s.name).join(', '),
      });
      setIsSlugManuallyEdited(true);
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        slug: '',
        description: '',
        subcategories: '',
      });
      setIsSlugManuallyEdited(false);
    }
    setIsCategoryModalOpen(true);
  };

  // Save Category (create or edit)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subs = categoryFormData.subcategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const cleanSlug = transliterateToSlug(categoryFormData.slug || categoryFormData.name);

      const payload = {
        name: categoryFormData.name.trim(),
        slug: cleanSlug,
        description: categoryFormData.description,
        subcategories: subs,
      };

      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showNotification(`Категория «${payload.name}» успешно обновлена`);
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryFormData({ name: '', slug: '', description: '', subcategories: '' });
          setIsSlugManuallyEdited(false);
          reloadData();
        } else {
          const err = await res.json();
          setActionError(err.error || 'Ошибка обновления категории');
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showNotification(`Категория «${payload.name}» успешно создана`);
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryFormData({ name: '', slug: '', description: '', subcategories: '' });
          setIsSlugManuallyEdited(false);
          reloadData();
        } else {
          const err = await res.json();
          setActionError(err.error || 'Ошибка создания категории');
        }
      }
    } catch {
      setActionError('Ошибка сохранения категории');
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию? Все входящие товары также будут удалены!')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      showNotification('Категория удалена');
      reloadData();
    } catch {
      setActionError('Ошибка удаления категории');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      showNotification('Настройки магазина сохранены');
    } catch {
      setActionError('Ошибка сохранения настроек');
    }
  };

  // Status labels helper
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'accepted': return 'Принят';
      case 'cooking': return 'Готовится';
      case 'delivering': return 'В пути / Готов к выдаче';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return '#D9822B';
      case 'accepted': return '#3B82F6';
      case 'cooking': return '#8B5CF6';
      case 'delivering': return '#C2622A';
      case 'completed': return '#3A6347';
      case 'cancelled': return '#A83838';
      default: return '#736B63';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-copper)' }} />
      </div>
    );
  }

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    if (orderStatusFilter === 'all') return true;
    return ord.status === orderStatusFilter;
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (productCategoryFilter !== 'all' && String(p.category_id) !== productCategoryFilter) {
      return false;
    }
    if (productBadgeFilter === 'with_badge') {
      if (!p.badge) return false;
    } else if (productBadgeFilter === 'no_badge') {
      if (p.badge) return false;
    } else if (productBadgeFilter !== 'all') {
      if (p.badge !== productBadgeFilter) return false;
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F6F2EA', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Top Header */}
      <header
        style={{
          background: 'var(--bg-dark)',
          color: '#FFFFFF',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-dark)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Image
            src="/images/logo-round.webp"
            alt="НЕВДАХИНЪ"
            width={40}
            height={40}
            style={{ borderRadius: '50%', background: '#FFFFFF', padding: '2px' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', lineHeight: 1.1 }}>НЕВДАХИНЪ</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Панель управления мануфактурой
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-light-muted)',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <ExternalLink size={14} />
            <span>Перейти на сайт витрины</span>
          </Link>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#F87171',
              background: 'rgba(239, 68, 68, 0.12)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <LogOut size={14} />
            <span>Выйти</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {actionSuccess && (
        <div
          style={{
            background: 'var(--accent-green-light)',
            color: 'var(--accent-green)',
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '14px',
            borderBottom: '1px solid #A6D4B2',
            textAlign: 'center',
          }}
        >
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div
          style={{
            background: 'var(--accent-red-light)',
            color: 'var(--accent-red)',
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '14px',
            borderBottom: '1px solid #F6BEBE',
            textAlign: 'center',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid var(--border-craft)',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '16px 18px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'orders' ? 'var(--accent-copper)' : 'var(--text-muted)',
              borderBottom: activeTab === 'orders' ? '3px solid var(--accent-copper)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShoppingBag size={18} />
            <span>Заказы</span>
            {orders.filter((o) => o.status === 'new').length > 0 && (
              <span
                style={{
                  background: 'var(--accent-copper)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 8px',
                  fontSize: '11px',
                }}
              >
                {orders.filter((o) => o.status === 'new').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '16px 18px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'products' ? 'var(--accent-copper)' : 'var(--text-muted)',
              borderBottom: activeTab === 'products' ? '3px solid var(--accent-copper)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Package size={18} />
            <span>Товары ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            style={{
              padding: '16px 18px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'categories' ? 'var(--accent-copper)' : 'var(--text-muted)',
              borderBottom: activeTab === 'categories' ? '3px solid var(--accent-copper)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={18} />
            <span>Категории ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '16px 18px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'settings' ? 'var(--accent-copper)' : 'var(--text-muted)',
              borderBottom: activeTab === 'settings' ? '3px solid var(--accent-copper)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Settings size={18} />
            <span>Настройки и доставка</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '1240px', width: '100%', margin: '0 auto' }}>
        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'Все заказы' },
                  { key: 'new', label: 'Новые' },
                  { key: 'accepted', label: 'Приняты' },
                  { key: 'cooking', label: 'Готовятся' },
                  { key: 'delivering', label: 'Доставка / Выдача' },
                  { key: 'completed', label: 'Выполнены' },
                  { key: 'cancelled', label: 'Отменены' },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setOrderStatusFilter(st.key)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: orderStatusFilter === st.key ? 'var(--bg-dark)' : '#FFFFFF',
                      color: orderStatusFilter === st.key ? '#FFFFFF' : 'var(--text-main)',
                      border: '1px solid var(--border-craft)',
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '48px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-craft)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <ShoppingBag size={40} style={{ margin: '0 auto 12px', color: 'var(--border-craft)' }} />
                <h3>В этой выборке нет заказов</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      padding: '20px',
                      border: '1px solid var(--border-craft)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Header Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-subtle)',
                        paddingBottom: '12px',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                          {ord.order_number}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {new Date(ord.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            background: getStatusColor(ord.status),
                            color: '#FFFFFF',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {getStatusLabel(ord.status)}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Delivery row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '16px',
                        marginBottom: '16px',
                        background: 'var(--bg-main)',
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Покупатель:</div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{ord.customer_name}</div>
                        <a
                          href={`tel:${ord.customer_phone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: 'var(--accent-copper)',
                            fontWeight: 600,
                            marginTop: '2px',
                          }}
                        >
                          <Phone size={14} />
                          <span>{ord.customer_phone}</span>
                        </a>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Способ получения:</div>
                        {ord.delivery_type === 'pickup' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginTop: '2px' }}>
                            <MapPin size={16} style={{ color: 'var(--accent-copper)' }} />
                            <span>Самовывоз (д. Бурцево, ул. Раздолье 236/2)</span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginTop: '2px' }}>
                              <Truck size={16} style={{ color: 'var(--accent-copper)' }} />
                              <span>Доставка курьером ({ord.delivery_distance_km} км)</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '2px' }}>
                              {ord.delivery_address}
                            </div>
                          </div>
                        )}
                      </div>

                      {ord.customer_comment && (
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Комментарий:</div>
                          <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}>
                            «{ord.customer_comment}»
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Items Table */}
                    <div style={{ marginBottom: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '6px 0' }}>Товар</th>
                            <th style={{ padding: '6px 12px' }}>Фасовка</th>
                            <th style={{ padding: '6px 12px' }}>Цена</th>
                            <th style={{ padding: '6px 12px' }}>Кол-во</th>
                            <th style={{ padding: '6px 0', textAlign: 'right' }}>Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ord.items?.map((it) => (
                            <tr key={it.id} style={{ borderBottom: '1px dashed var(--border-subtle)' }}>
                              <td style={{ padding: '8px 0', fontWeight: 600 }}>{it.title}</td>
                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{it.weight}</td>
                              <td style={{ padding: '8px 12px' }}>{it.price} ₽</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{it.quantity} шт</td>
                              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>{it.subtotal} ₽</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Row: Summary and Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ fontSize: '14px' }}>
                        <span>Сумма: <strong>{ord.subtotal} ₽</strong></span>
                        {ord.delivery_cost > 0 && <span> + Доставка: <strong>{ord.delivery_cost} ₽</strong></span>}
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-copper)', marginLeft: '12px' }}>
                          Итого к оплате: {ord.total_amount} ₽
                        </span>
                      </div>

                      {/* Quick Status Changers */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ord.status === 'new' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'accepted')}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Принять заказ
                          </button>
                        )}
                        {ord.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'cooking')}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', background: '#8B5CF6' }}
                          >
                            Начать сборку/готовку
                          </button>
                        )}
                        {ord.status === 'cooking' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'delivering')}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Передать на доставку / выдачу
                          </button>
                        )}
                        {ord.status === 'delivering' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--accent-green)' }}
                          >
                            Заказ выдан / доставлен
                          </button>
                        )}
                        {ord.status !== 'cancelled' && ord.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                            style={{
                              padding: '6px 10px',
                              fontSize: '12px',
                              color: 'var(--accent-red)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid #F8B4B4',
                            }}
                          >
                            Отменить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div>
            {/* Badge Info Banner */}
            <div
              style={{
                background: '#FFF9F0',
                border: '1px solid #F0DFCC',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Tag size={18} style={{ color: 'var(--accent-copper)', flexShrink: 0 }} />
              <div>
                <strong>Бейджи (метки на товарах):</strong> метки («Хит продаж», «Семейный рецепт», «Новинка» или свой произвольный текст) настраиваются индивидуально для каждого товара при нажатии <strong>«Изменить»</strong> (<Edit2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />) в таблице ниже.
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Поиск по названию или метке..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="form-select"
                  style={{ width: '200px', height: '38px', fontSize: '13px' }}
                >
                  <option value="all">Все категории</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={productBadgeFilter}
                  onChange={(e) => setProductBadgeFilter(e.target.value)}
                  className="form-select"
                  style={{ width: '190px', height: '38px', fontSize: '13px' }}
                >
                  <option value="all">Все метки</option>
                  <option value="with_badge">★ Только с метками</option>
                  <option value="no_badge">Без меток</option>
                  <option value="Хит продаж">Хит продаж</option>
                  <option value="Семейный рецепт">Семейный рецепт</option>
                  <option value="Новинка">Новинка</option>
                  <option value="ГОСТ 1936">ГОСТ 1936</option>
                  <option value="Рекомендуем">Рекомендуем</option>
                  <option value="Ограниченная партия">Ограниченная партия</option>
                  <option value="Детям">Детям</option>
                </select>
              </div>

              <button
                onClick={() => handleOpenProductModal()}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '14px' }}
              >
                <Plus size={16} />
                <span>Добавить деликатес</span>
              </button>
            </div>

            {/* Products Table */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-craft)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-craft)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', width: '60px' }}>Фото</th>
                    <th style={{ padding: '12px 16px' }}>Название и категория</th>
                    <th style={{ padding: '12px 16px' }}>Метка (бейдж)</th>
                    <th style={{ padding: '12px 16px' }}>Фасовка</th>
                    <th style={{ padding: '12px 16px' }}>Цена</th>
                    <th style={{ padding: '12px 16px' }}>Наличие</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div
                          style={{
                            position: 'relative',
                            width: '44px',
                            height: '44px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            background: '#EAE1D3',
                          }}
                        >
                          <Image
                            src={p.images[0] || '/images/products/tushenka.jpg'}
                            alt={p.title}
                            fill
                            sizes="44px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--bg-dark)' }}>{p.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {p.category_name} {p.subcategory_name ? `› ${p.subcategory_name}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {p.badge ? (
                          <span
                            className={`badge-craft ${
                              p.badge === 'Хит продаж' || p.badge === 'Хит' || p.badge === 'Рекомендуем'
                                ? 'badge-hit'
                                : p.badge === 'Семейный рецепт' || p.badge === 'ГОСТ 1936' || p.badge === 'Ограниченная партия'
                                ? 'badge-recipe'
                                : p.badge === 'Новинка' || p.badge === 'Детям'
                                ? 'badge-new'
                                : ''
                            }`}
                            style={
                              !['Хит продаж', 'Хит', 'Рекомендуем', 'Семейный рецепт', 'ГОСТ 1936', 'Ограниченная партия', 'Новинка', 'Детям'].includes(p.badge)
                                ? { background: '#F0EBE1', color: 'var(--text-main)', border: '1px solid var(--border-craft)', fontSize: '10.5px' }
                                : { fontSize: '10.5px' }
                            }
                          >
                            {p.badge}
                          </span>
                        ) : (
                          <span style={{ color: '#BDB3A6', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{p.weight || '—'}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <strong style={{ fontSize: '14px' }}>{p.price} ₽</strong>
                        {p.old_price && <div style={{ fontSize: '11px', textDecoration: 'line-through', color: '#A0988E' }}>{p.old_price} ₽</div>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {p.in_stock === 1 ? (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>В наличии</span>
                        ) : (
                          <span style={{ color: '#8C827A', fontWeight: 600 }}>Под заказ</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              background: 'var(--bg-craft)',
                              color: 'var(--text-main)',
                            }}
                            title="Редактировать"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              background: 'var(--accent-red-light)',
                              color: 'var(--accent-red)',
                            }}
                            title="Удалить"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px' }}>Категории и подкатегории</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Создавайте и редактируйте разделы каталога. Слаг формируется автоматически из названия.
                </p>
              </div>
              <button
                onClick={() => handleOpenCategoryModal()}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '14px' }}
              >
                <Plus size={16} />
                <span>Добавить категорию</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    border: '1px solid var(--border-craft)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '18px', color: 'var(--bg-dark)' }}>{cat.name}</h4>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          URL-слаг: <code style={{ background: 'var(--bg-craft)', padding: '1px 5px', borderRadius: '4px' }}>{cat.slug}</code>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenCategoryModal(cat)}
                          style={{
                            background: 'var(--bg-craft)',
                            border: '1px solid var(--border-craft)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '12px',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                          }}
                          title="Редактировать категорию"
                        >
                          <Edit2 size={14} style={{ color: 'var(--accent-copper)' }} />
                          <span>Изменить</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          style={{
                            background: '#FFF0F0',
                            border: '1px solid #F5C6CB',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            color: 'var(--accent-red)',
                          }}
                          title="Удалить категорию"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {cat.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                      Подкатегории:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {cat.subcategories && cat.subcategories.length > 0 ? (
                        cat.subcategories.map((sub) => (
                          <span
                            key={sub.id}
                            style={{
                              padding: '3px 8px',
                              background: 'var(--bg-craft)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
                              border: '1px solid var(--border-craft)',
                            }}
                          >
                            {sub.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: '#9E9489' }}>Нет подкатегорий</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '680px' }}>
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--border-craft)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '22px', marginBottom: '16px' }}>Параметры доставки и мануфактуры</h3>

              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Широта производства (lat)</label>
                    <input
                      type="text"
                      value={settings.base_lat || ''}
                      onChange={(e) => setSettings({ ...settings, base_lat: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Долгота производства (lon)</label>
                    <input
                      type="text"
                      value={settings.base_lon || ''}
                      onChange={(e) => setSettings({ ...settings, base_lon: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Адрес цеха (для самовывоза)</label>
                  <input
                    type="text"
                    value={settings.base_address || ''}
                    onChange={(e) => setSettings({ ...settings, base_address: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Радиус доставки (км)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.delivery_radius_km || '4.0'}
                      onChange={(e) => setSettings({ ...settings, delivery_radius_km: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Цена доставки (₽)</label>
                    <input
                      type="number"
                      value={settings.delivery_price || '250'}
                      onChange={(e) => setSettings({ ...settings, delivery_price: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Бесплатно от (₽)</label>
                    <input
                      type="number"
                      value={settings.free_delivery_threshold || '5000'}
                      onChange={(e) => setSettings({ ...settings, free_delivery_threshold: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Наименование производителя</label>
                  <input
                    type="text"
                    value={settings.producer_name || ''}
                    onChange={(e) => setSettings({ ...settings, producer_name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">ОГРНИП</label>
                    <input
                      type="text"
                      value={settings.producer_ogrnip || ''}
                      onChange={(e) => setSettings({ ...settings, producer_ogrnip: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ИНН</label>
                    <input
                      type="text"
                      value={settings.producer_inn || ''}
                      onChange={(e) => setSettings({ ...settings, producer_inn: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                  Сохранить настройки
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '22px' }}>
                {editingProduct ? 'Редактировать деликатес' : 'Добавить деликатес'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              {/* Image Upload Row */}
              <div className="form-group">
                <label className="form-label">Фотографии деликатеса</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                  {productFormData.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: '70px',
                        height: '70px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-craft)',
                      }}
                    >
                      <Image src={img} alt="preview" fill sizes="70px" style={{ objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() =>
                          setProductFormData((p) => ({
                            ...p,
                            images: p.images.filter((_, i) => i !== idx),
                          }))
                        }
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <label
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '8px',
                      border: '2px dashed var(--border-craft)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'var(--bg-craft)',
                    }}
                  >
                    {uploadingImage ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Upload size={18} style={{ color: 'var(--accent-copper)' }} />
                        <span style={{ fontSize: '10px', marginTop: '2px' }}>Загрузить</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Title & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Название продукта *</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Колбаса Краковская"
                    value={productFormData.title}
                    onChange={(e) => setProductFormData({ ...productFormData, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Категория *</label>
                  <select
                    required
                    value={productFormData.category_id}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        category_id: e.target.value,
                        subcategory_id: '',
                      })
                    }
                    className="form-select"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subcategory */}
              <div className="form-group">
                <label className="form-label">Подкатегория</label>
                <select
                  value={productFormData.subcategory_id}
                  onChange={(e) => setProductFormData({ ...productFormData, subcategory_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Без подкатегории</option>
                  {categories
                    .find((c) => String(c.id) === productFormData.category_id)
                    ?.subcategories?.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Badge Management Section */}
              <div
                style={{
                  background: '#FCF9F4',
                  border: '1px solid var(--border-craft)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px' }}>
                    <Tag size={15} style={{ color: 'var(--accent-copper)' }} />
                    <span>Бейдж / метка деликатеса</span>
                  </label>
                  {productFormData.badge && (
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, badge: '' })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-red)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      ✕ Убрать метку
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Выберите готовую метку или введите свой текст. Метка отображается в верхнем углу карточки товара на сайте.
                </p>

                {/* Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {[
                    { label: 'Хит продаж', bg: '#FFF4E5', color: '#B25E09', border: '#FCD34D' },
                    { label: 'Семейный рецепт', bg: '#FDF2EB', color: '#C2622A', border: '#F5C7A9' },
                    { label: 'Новинка', bg: '#EBF3ED', color: '#3A6347', border: '#B7DDC2' },
                    { label: 'ГОСТ 1936', bg: '#FDF2EB', color: '#C2622A', border: '#F5C7A9' },
                    { label: 'Рекомендуем', bg: '#FFF4E5', color: '#B25E09', border: '#FCD34D' },
                    { label: 'Ограниченная партия', bg: '#FDF2EB', color: '#C2622A', border: '#F5C7A9' },
                    { label: 'Детям', bg: '#EBF3ED', color: '#3A6347', border: '#B7DDC2' },
                  ].map((preset) => {
                    const isSelected = productFormData.badge === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setProductFormData({ ...productFormData, badge: isSelected ? '' : preset.label })}
                        style={{
                          padding: '5px 11px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isSelected ? '2px solid var(--accent-copper)' : `1px solid ${preset.border}`,
                          background: isSelected ? '#FAF0E6' : preset.bg,
                          color: isSelected ? 'var(--accent-copper)' : preset.color,
                          boxShadow: isSelected ? '0 0 0 1px var(--accent-copper)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom badge input & Live preview */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Или введите свой текст (например: Скидка 15%, Острое, Постное...)"
                    value={productFormData.badge}
                    onChange={(e) => setProductFormData({ ...productFormData, badge: e.target.value })}
                    className="form-input"
                    style={{ flex: 1, background: '#FFFFFF' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Вид:</span>
                    {productFormData.badge ? (
                      <span
                        className={`badge-craft ${
                          productFormData.badge === 'Хит продаж' || productFormData.badge === 'Хит' || productFormData.badge === 'Рекомендуем'
                            ? 'badge-hit'
                            : productFormData.badge === 'Семейный рецепт' || productFormData.badge === 'ГОСТ 1936' || productFormData.badge === 'Ограниченная партия'
                            ? 'badge-recipe'
                            : productFormData.badge === 'Новинка' || productFormData.badge === 'Детям'
                            ? 'badge-new'
                            : ''
                        }`}
                        style={
                          !['Хит продаж', 'Хит', 'Рекомендуем', 'Семейный рецепт', 'ГОСТ 1936', 'Ограниченная партия', 'Новинка', 'Детям'].includes(productFormData.badge)
                            ? { background: '#F0EBE1', color: 'var(--text-main)', border: '1px solid var(--border-craft)' }
                            : undefined
                        }
                      >
                        {productFormData.badge}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#A0988E', fontStyle: 'italic' }}>без метки</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price, Old price, Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Цена (₽) *</label>
                  <input
                    type="number"
                    required
                    placeholder="450"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Старая цена (₽)</label>
                  <input
                    type="number"
                    placeholder="520"
                    value={productFormData.old_price}
                    onChange={(e) => setProductFormData({ ...productFormData, old_price: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Фасовка / вес</label>
                  <input
                    type="text"
                    placeholder="500 г / кольцо ~400г"
                    value={productFormData.weight}
                    onChange={(e) => setProductFormData({ ...productFormData, weight: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Composition */}
              <div className="form-group">
                <label className="form-label">Состав (ингредиенты)</label>
                <textarea
                  rows={2}
                  placeholder="Мясо фермерское, чеснок, перец, соль..."
                  value={productFormData.composition}
                  onChange={(e) => setProductFormData({ ...productFormData, composition: e.target.value })}
                  className="form-textarea"
                />
              </div>

              {/* Storage & In-stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Условия и срок хранения</label>
                  <input
                    type="text"
                    placeholder="25 суток при температуре от +2°C до +6°C"
                    value={productFormData.storage}
                    onChange={(e) => setProductFormData({ ...productFormData, storage: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Наличие</label>
                  <select
                    value={productFormData.in_stock}
                    onChange={(e) => setProductFormData({ ...productFormData, in_stock: Number(e.target.value) })}
                    className="form-select"
                  >
                    <option value={1}>В наличии</option>
                    <option value={0}>Под заказ / ожидается</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Описание продукта</label>
                <textarea
                  rows={3}
                  placeholder="Подробное описание вкуса, технологии приготовления..."
                  value={productFormData.description}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Сохранить деликатес
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CATEGORY */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '26px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px' }}>
                {editingCategory ? `Редактировать категорию «${editingCategory.name}»` : 'Новая категория'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Название категории *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Сырная лавка"
                  value={categoryFormData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setCategoryFormData((prev) => ({
                      ...prev,
                      name: newName,
                      slug: !isSlugManuallyEdited || !prev.slug ? transliterateToSlug(newName) : prev.slug,
                    }));
                  }}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Слаг (URL-идентификатор) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = transliterateToSlug(categoryFormData.name);
                      setCategoryFormData((prev) => ({ ...prev, slug: auto }));
                      setIsSlugManuallyEdited(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-copper)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Сгенерировать из названия</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="syrnaya-lavka"
                  value={categoryFormData.slug}
                  onChange={(e) => {
                    setIsSlugManuallyEdited(true);
                    setCategoryFormData({ ...categoryFormData, slug: e.target.value });
                  }}
                  className="form-input"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  Генерируется автоматически из названия категории на латинице (транслит)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Краткое описание</label>
                <textarea
                  rows={2}
                  placeholder="Описание для покупателей..."
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Подкатегории (через запятую)</label>
                <input
                  type="text"
                  placeholder="Твердые сыры, Мягкие сыры, Творог"
                  value={categoryFormData.subcategories}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, subcategories: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Сохранить изменения' : 'Создать категорию'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
