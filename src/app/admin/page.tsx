'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category, Product, Order, OrderStatus, Badge, Recipe, RecipeIngredient, RecipeStep } from '@/types';
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
  BookOpen,
  Copy,
  ArrowUp,
  ArrowDown,
  Video,
  Palette,
  Eye,
} from 'lucide-react';
import { transliterateToSlug } from '@/lib/slug';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'badges' | 'recipes' | 'settings'>('orders');
  const [loading, setLoading] = useState(true);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
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

  // Badge Modal State
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [badgeFormData, setBadgeFormData] = useState({
    name: '',
    bg_color: '#FFF4E5',
    text_color: '#B25E09',
    border_color: '#FCD34D',
  });

  // Recipe Modal State & Cloner
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isRecipeSlugManuallyEdited, setIsRecipeSlugManuallyEdited] = useState(false);
  const [selectedRecipeToCopy, setSelectedRecipeToCopy] = useState('');
  const [recipeFormData, setRecipeFormData] = useState({
    title: '',
    slug: '',
    product_id: '',
    description: '',
    cover_image: '',
    video_url: '',
    prep_time: '35 мин',
    portions: '4 порции',
    difficulty: 'Средне',
    ingredients: [{ name: '', amount: '' }] as RecipeIngredient[],
    steps: [{ step_number: 1, title: '', description: '', image_url: '', tip: '' }] as RecipeStep[],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Prevent accidental modal closing when dragging text selection outside modal window
  const overlayMouseDownTarget = useRef<EventTarget | null>(null);

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    overlayMouseDownTarget.current = e.target;
  };

  const handleOverlayClick = (e: React.MouseEvent, closeFn: () => void) => {
    if (overlayMouseDownTarget.current === e.currentTarget && e.target === e.currentTarget) {
      closeFn();
    }
    overlayMouseDownTarget.current = null;
  };

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
      const [ordRes, prodRes, catRes, setRes, badgeRes, recRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products?admin=1'),
        fetch('/api/categories'),
        fetch('/api/settings'),
        fetch('/api/badges'),
        fetch('/api/recipes?admin=1'),
      ]);

      if (ordRes.ok) setOrders(await ordRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (setRes.ok) setSettings(await setRes.json());
      if (badgeRes.ok) setBadges(await badgeRes.json());
      if (recRes.ok) setRecipes(await recRes.json());
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

  // Single File Upload Helper
  const uploadSingleFile = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.urls && data.urls[0]) {
        return data.urls[0];
      }
      return null;
    } catch {
      return null;
    }
  };

  // BADGES HANDLERS
  const handleOpenBadgeModal = (badge?: Badge) => {
    if (badge) {
      setEditingBadge(badge);
      setBadgeFormData({
        name: badge.name,
        bg_color: badge.bg_color || '#FFF4E5',
        text_color: badge.text_color || '#B25E09',
        border_color: badge.border_color || '#FCD34D',
      });
    } else {
      setEditingBadge(null);
      setBadgeFormData({
        name: '',
        bg_color: '#FFF4E5',
        text_color: '#B25E09',
        border_color: '#FCD34D',
      });
    }
    setIsBadgeModalOpen(true);
  };

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeFormData.name.trim()) {
      setActionError('Введите название метки');
      return;
    }

    try {
      const url = editingBadge ? `/api/badges/${editingBadge.id}` : '/api/badges';
      const method = editingBadge ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badgeFormData),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(editingBadge ? 'Метка успешно обновлена' : 'Метка успешно создана');
        setIsBadgeModalOpen(false);
        reloadData();
      } else {
        setActionError(data.error || 'Ошибка при сохранении метки');
      }
    } catch {
      setActionError('Ошибка сохранения метки');
    }
  };

  const handleDeleteBadge = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту метку? У всех товаров она будет снята.')) return;

    try {
      const res = await fetch(`/api/badges/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Метка удалена');
        reloadData();
      } else {
        setActionError('Не удалось удалить метку');
      }
    } catch {
      setActionError('Ошибка удаления');
    }
  };

  // RECIPES HANDLERS
  const handleOpenRecipeModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setIsRecipeSlugManuallyEdited(true);
      setSelectedRecipeToCopy('');
      setRecipeFormData({
        title: recipe.title,
        slug: recipe.slug,
        product_id: recipe.product_id ? String(recipe.product_id) : '',
        description: recipe.description || '',
        cover_image: recipe.cover_image || '',
        video_url: recipe.video_url || '',
        prep_time: recipe.prep_time || '35 мин',
        portions: recipe.portions || '4 порции',
        difficulty: recipe.difficulty || 'Средне',
        ingredients: recipe.ingredients && recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', amount: '' }],
        steps: recipe.steps && recipe.steps.length > 0 ? recipe.steps : [{ step_number: 1, title: '', description: '', image_url: '', tip: '' }],
      });
    } else {
      setEditingRecipe(null);
      setIsRecipeSlugManuallyEdited(false);
      setSelectedRecipeToCopy('');
      setRecipeFormData({
        title: '',
        slug: '',
        product_id: products[0]?.id ? String(products[0].id) : '',
        description: '',
        cover_image: '/images/products/tushenka.jpg',
        video_url: '',
        prep_time: '35 мин',
        portions: '4 порции',
        difficulty: 'Средне',
        ingredients: [
          { name: 'Основной деликатес', amount: '1 банка / уп.' },
          { name: 'Лук репчатый', amount: '1 шт' },
        ],
        steps: [
          { step_number: 1, title: 'Подготовка продуктов', description: 'Подготовьте ремесленный деликатес и необходимые овощи.', image_url: '', tip: '' },
        ],
      });
    }
    setIsRecipeModalOpen(true);
  };

  const handleCopyRecipeFromOther = () => {
    if (!selectedRecipeToCopy) return;
    const sourceRecipe = recipes.find((r) => String(r.id) === selectedRecipeToCopy);
    if (!sourceRecipe) return;

    setRecipeFormData((prev) => ({
      ...prev,
      title: prev.title || `Фирменное блюдо (${sourceRecipe.title})`,
      slug: !isRecipeSlugManuallyEdited && prev.title ? transliterateToSlug(prev.title) : prev.slug,
      description: sourceRecipe.description,
      prep_time: sourceRecipe.prep_time,
      portions: sourceRecipe.portions,
      difficulty: sourceRecipe.difficulty,
      cover_image: sourceRecipe.cover_image,
      video_url: sourceRecipe.video_url || '',
      ingredients: JSON.parse(JSON.stringify(sourceRecipe.ingredients || [])),
      steps: JSON.parse(JSON.stringify(sourceRecipe.steps || [])),
    }));
    showNotification(`Рецепт «${sourceRecipe.title}» скопирован! Теперь вы можете быстро изменить детали и шаги.`);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeFormData.title.trim()) {
      setActionError('Введите название рецепта');
      return;
    }

    try {
      const url = editingRecipe ? `/api/recipes/${editingRecipe.id}` : '/api/recipes';
      const method = editingRecipe ? 'PUT' : 'POST';

      const payload = {
        ...recipeFormData,
        product_id: recipeFormData.product_id ? Number(recipeFormData.product_id) : null,
        ingredients: recipeFormData.ingredients.filter((i) => i.name.trim() !== ''),
        steps: recipeFormData.steps.map((s, idx) => ({
          ...s,
          step_number: idx + 1,
        })),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(editingRecipe ? 'Рецепт успешно обновлен' : 'Рецепт успешно создан');
        setIsRecipeModalOpen(false);
        reloadData();
      } else {
        setActionError(data.error || 'Ошибка сохранения рецепта');
      }
    } catch {
      setActionError('Ошибка сохранения рецепта');
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот рецепт?')) return;

    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Рецепт удален');
        reloadData();
      } else {
        setActionError('Не удалось удалить рецепт');
      }
    } catch {
      setActionError('Ошибка удаления рецепта');
    }
  };

  const handleRecipeCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    const url = await uploadSingleFile(files[0]);
    setUploadingImage(false);
    if (url) {
      setRecipeFormData((prev) => ({ ...prev, cover_image: url }));
      showNotification('Обложка рецепта загружена');
    } else {
      setActionError('Ошибка загрузки обложки');
    }
  };

  const handleStepImageUpload = async (stepIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    const url = await uploadSingleFile(files[0]);
    setUploadingImage(false);
    if (url) {
      setRecipeFormData((prev) => {
        const nextSteps = [...prev.steps];
        nextSteps[stepIdx] = { ...nextSteps[stepIdx], image_url: url };
        return { ...prev, steps: nextSteps };
      });
      showNotification(`Фото для шага ${stepIdx + 1} загружено`);
    } else {
      setActionError('Ошибка загрузки фото шага');
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
            onClick={() => setActiveTab('badges')}
            style={{
              padding: '16px 18px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'badges' ? 'var(--accent-copper)' : 'var(--text-muted)',
              borderBottom: activeTab === 'badges' ? '3px solid var(--accent-copper)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Tag size={18} />
            <span>Метки (Бейджи) ({badges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            style={{
              padding: '16px 18px',
              fontWeight: 700,
              fontSize: '14px',
              color: activeTab === 'recipes' ? 'var(--accent-copper)' : 'var(--text-muted)',
              borderBottom: activeTab === 'recipes' ? '3px solid var(--accent-copper)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BookOpen size={18} />
            <span>Рецепты ({recipes.length})</span>
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

        {/* TAB 4: BADGES (МЕТКИ) */}
        {activeTab === 'badges' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={20} style={{ color: 'var(--accent-copper)' }} />
                  <span>Метки (Бейджи) товаров</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Создавайте метки с индивидуальными цветами (фон, текст, рамка). В редактировании товара достаточно просто выбрать готовую метку.
                </p>
              </div>
              <button
                onClick={() => handleOpenBadgeModal()}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '14px' }}
              >
                <Plus size={16} />
                <span>Создать новую метку</span>
              </button>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-craft)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-craft)', borderBottom: '1px solid var(--border-craft)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 18px' }}>Внешний вид (Превью)</th>
                    <th style={{ padding: '12px 18px' }}>Название метки</th>
                    <th style={{ padding: '12px 18px' }}>Настройки цвета (HEX)</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center' }}>Товаров с меткой</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {badges.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Пока нет созданных меток. Нажмите «Создать новую метку», чтобы добавить.
                      </td>
                    </tr>
                  ) : (
                    badges.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            className="badge-craft"
                            style={{
                              backgroundColor: b.bg_color,
                              color: b.text_color,
                              borderColor: b.border_color,
                              fontSize: '12px',
                              padding: '5px 12px',
                              display: 'inline-block',
                            }}
                          >
                            {b.name}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--bg-dark)' }}>
                          {b.name}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: b.bg_color, border: '1px solid #CCC', display: 'inline-block' }} />
                              <span style={{ color: 'var(--text-muted)' }}>Фон:</span>
                              <code>{b.bg_color}</code>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: b.text_color, border: '1px solid #CCC', display: 'inline-block' }} />
                              <span style={{ color: 'var(--text-muted)' }}>Текст:</span>
                              <code>{b.text_color}</code>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: b.border_color, border: '1px solid #CCC', display: 'inline-block' }} />
                              <span style={{ color: 'var(--text-muted)' }}>Рамка:</span>
                              <code>{b.border_color}</code>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <span
                            style={{
                              background: 'var(--bg-craft)',
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {b.product_count || 0}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenBadgeModal(b)}
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
                              title="Редактировать цвет и название"
                            >
                              <Edit2 size={13} style={{ color: 'var(--accent-copper)' }} />
                              <span>Изменить</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBadge(b.id)}
                              style={{
                                background: '#FFF0F0',
                                border: '1px solid #F5C6CB',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                color: 'var(--accent-red)',
                              }}
                              title="Удалить метку"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: RECIPES (РЕЦЕПТЫ) */}
        {activeTab === 'recipes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={20} style={{ color: 'var(--accent-copper)' }} />
                  <span>Фирменные пошаговые рецепты ({recipes.length})</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Конструктор рецептов с пошаговыми инструкциями, фотографиями, видео и секретами мастера.
                  Привязанные товары получают метку «Рецепт» в каталоге, а в конце рецепта есть прямая кнопка заказа.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  href="/recipes"
                  target="_blank"
                  className="btn-secondary"
                  style={{ padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} />
                  <span>Открыть витрину рецептов</span>
                </Link>
                <button
                  onClick={() => handleOpenRecipeModal()}
                  className="btn-primary"
                  style={{ padding: '10px 18px', fontSize: '14px' }}
                >
                  <Plus size={16} />
                  <span>Добавить рецепт</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {recipes.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-craft)' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Пока нет добавленных рецептов.</p>
                  <button onClick={() => handleOpenRecipeModal()} className="btn-primary">
                    <Plus size={16} />
                    <span>Создать первый рецепт</span>
                  </button>
                </div>
              ) : (
                recipes.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-craft)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ position: 'relative', height: '170px', width: '100%', background: '#EDE5D8' }}>
                      <Image
                        src={r.cover_image || '/images/products/tushenka.jpg'}
                        alt={r.title}
                        fill
                        sizes="400px"
                        style={{ objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        {r.video_url && (
                          <span style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Video size={12} />
                            Видео
                          </span>
                        )}
                        <span style={{ background: 'rgba(58, 99, 71, 0.9)', color: '#FFF', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {r.difficulty}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,255,255,0.92)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        ⏱ {r.prep_time} • {r.portions}
                      </div>
                    </div>

                    <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '17px', color: 'var(--bg-dark)', marginBottom: '6px', lineHeight: 1.3 }}>
                          {r.title}
                        </h4>
                        {r.description && (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {r.description}
                          </p>
                        )}

                        <div style={{ background: 'var(--bg-craft)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', marginBottom: '12px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Привязанный товар: </span>
                          <strong style={{ color: 'var(--accent-copper)' }}>
                            {r.product_title ? `${r.product_title} (${r.product_price} ₽)` : 'Не привязан'}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>📝 Ингредиентов: <strong>{r.ingredients?.length || 0}</strong></span>
                          <span>🪜 Шагов: <strong>{r.steps?.length || 0}</strong></span>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link
                          href={`/recipes/${r.slug}`}
                          target="_blank"
                          style={{
                            fontSize: '12px',
                            color: 'var(--accent-copper)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={13} />
                          <span>На сайт</span>
                        </Link>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenRecipeModal(r)}
                            style={{
                              background: 'var(--bg-craft)',
                              border: '1px solid var(--border-craft)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                            }}
                          >
                            <Edit2 size={13} style={{ color: 'var(--accent-copper)' }} />
                            <span>Править</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRecipe(r.id)}
                            style={{
                              background: '#FFF0F0',
                              border: '1px solid #F5C6CB',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              color: 'var(--accent-red)',
                            }}
                            title="Удалить рецепт"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={(e) => handleOverlayClick(e, () => setIsProductModalOpen(false))}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
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

              {/* Badge Selection from Existing Badges */}
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      setActiveTab('badges');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-copper)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    + Управление списком меток и цветами
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Выберите метку из созданных во вкладке «Метки». Цвет и оформление настраиваются там же.
                </p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    style={{ flex: 1, background: '#FFFFFF' }}
                    value={productFormData.badge}
                    onChange={(e) => setProductFormData({ ...productFormData, badge: e.target.value })}
                  >
                    <option value="">— Без метки (стандартный товар) —</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  {/* Live preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Вид:</span>
                    {productFormData.badge ? (() => {
                      const matchedBadge = badges.find((b) => b.name === productFormData.badge);
                      return (
                        <span
                          className="badge-craft"
                          style={{
                            backgroundColor: matchedBadge?.bg_color || '#FFF4E5',
                            color: matchedBadge?.text_color || '#B25E09',
                            borderColor: matchedBadge?.border_color || '#FCD34D',
                          }}
                        >
                          {productFormData.badge}
                        </span>
                      );
                    })() : (
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
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={(e) => handleOverlayClick(e, () => setIsCategoryModalOpen(false))}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
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

      {/* MODAL: ADD / EDIT BADGE */}
      {isBadgeModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={(e) => handleOverlayClick(e, () => setIsBadgeModalOpen(false))}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={18} style={{ color: 'var(--accent-copper)' }} />
                <span>{editingBadge ? 'Редактировать метку' : 'Создать новую метку'}</span>
              </h3>
              <button onClick={() => setIsBadgeModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBadge}>
              <div className="form-group">
                <label className="form-label">Название метки *</label>
                <input
                  type="text"
                  placeholder="Например: Хит продаж, Семейный рецепт, Постное..."
                  value={badgeFormData.name}
                  onChange={(e) => setBadgeFormData({ ...badgeFormData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {/* Color Preset Palette */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Palette size={14} style={{ color: 'var(--accent-copper)' }} />
                  <span>Готовые цветовые палитры:</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { name: 'Охра / Золото', bg: '#FFF4E5', text: '#B25E09', border: '#FCD34D' },
                    { name: 'Терракот / Кирпич', bg: '#FDF2EB', text: '#C2622A', border: '#F5C7A9' },
                    { name: 'Хвоя / Зелень', bg: '#EBF3ED', text: '#3A6347', border: '#B7DDC2' },
                    { name: 'Бордо / Рубин', bg: '#FDF2F2', text: '#991B1B', border: '#FCA5A5' },
                    { name: 'Медовый янтарь', bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' },
                    { name: 'Дымчатый графит', bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
                    { name: 'Тёмный ремесленный', bg: '#2C241D', text: '#D9822B', border: '#4A3E31' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setBadgeFormData({
                          ...badgeFormData,
                          bg_color: preset.bg,
                          text_color: preset.text,
                          border_color: preset.border,
                        })
                      }
                      style={{
                        padding: '6px 10px',
                        background: preset.bg,
                        color: preset.text,
                        border: `1px solid ${preset.border}`,
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Color Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Цвет фона</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={badgeFormData.bg_color}
                      onChange={(e) => setBadgeFormData({ ...badgeFormData, bg_color: e.target.value })}
                      style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={badgeFormData.bg_color}
                      onChange={(e) => setBadgeFormData({ ...badgeFormData, bg_color: e.target.value })}
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Цвет текста</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={badgeFormData.text_color}
                      onChange={(e) => setBadgeFormData({ ...badgeFormData, text_color: e.target.value })}
                      style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={badgeFormData.text_color}
                      onChange={(e) => setBadgeFormData({ ...badgeFormData, text_color: e.target.value })}
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Цвет рамки</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={badgeFormData.border_color}
                      onChange={(e) => setBadgeFormData({ ...badgeFormData, border_color: e.target.value })}
                      style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={badgeFormData.border_color}
                      onChange={(e) => setBadgeFormData({ ...badgeFormData, border_color: e.target.value })}
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div
                style={{
                  background: 'var(--bg-craft)',
                  border: '1px solid var(--border-craft)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Живой просмотр метки:
                </div>
                <span
                  className="badge-craft"
                  style={{
                    backgroundColor: badgeFormData.bg_color,
                    color: badgeFormData.text_color,
                    borderColor: badgeFormData.border_color,
                    fontSize: '14px',
                    padding: '6px 16px',
                    display: 'inline-block',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  {badgeFormData.name.trim() || 'Пример названия метки'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  {editingBadge ? 'Сохранить метку' : 'Создать метку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECIPE CONSTRUCTOR */}
      {isRecipeModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={(e) => handleOverlayClick(e, () => setIsRecipeModalOpen(false))}
        >
          <div
            className="modal-content"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '840px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={20} style={{ color: 'var(--accent-copper)' }} />
                  <span>{editingRecipe ? 'Редактировать рецепт' : 'Конструктор пошагового рецепта'}</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Заполните шаги приготовления, привяжите товар витрины и добавьте фото/видео мастера.
                </p>
              </div>
              <button onClick={() => setIsRecipeModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Clone / Copy from Existing Recipe */}
            <div
              style={{
                background: '#FDF7EE',
                border: '1px solid #EADBCC',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: '22px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--accent-copper)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Copy size={16} />
                    <span>Быстрое заполнение: скопировать рецепт другого изделия</span>
                  </strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Скопируйте ингредиенты и структуру шагов схожего деликатеса, чтобы быстро подправить детали.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={selectedRecipeToCopy}
                    onChange={(e) => setSelectedRecipeToCopy(e.target.value)}
                    className="form-input"
                    style={{ minWidth: '220px', padding: '6px 10px', fontSize: '12.5px', background: '#FFFFFF' }}
                  >
                    <option value="">— Выберите рецепт для копирования —</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.product_title || 'без товара'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleCopyRecipeFromOther}
                    disabled={!selectedRecipeToCopy}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12.5px', opacity: selectedRecipeToCopy ? 1 : 0.5 }}
                  >
                    Скопировать
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveRecipe}>
              {/* Product binding */}
              <div className="form-group">
                <label className="form-label">Привязанный товар из каталога</label>
                <select
                  value={recipeFormData.product_id}
                  onChange={(e) => setRecipeFormData({ ...recipeFormData, product_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">— Не привязывать (общий рецепт) —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.price} ₽, {p.weight || 'весовой'})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  У выбранного товара появится значок «Рецепт» в магазине и кнопка перехода к этому рецепту.
                </span>
              </div>

              {/* Title & Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Название рецепта *</label>
                  <input
                    type="text"
                    placeholder="Например: Гречка с томлёной говядиной по-купечески"
                    value={recipeFormData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setRecipeFormData((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: !isRecipeSlugManuallyEdited || !prev.slug ? transliterateToSlug(newTitle) : prev.slug,
                      }));
                    }}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Слаг URL *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const auto = transliterateToSlug(recipeFormData.title);
                        setRecipeFormData((prev) => ({ ...prev, slug: auto }));
                        setIsRecipeSlugManuallyEdited(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-copper)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Сгенерировать
                    </button>
                  </div>
                  <input
                    type="text"
                    value={recipeFormData.slug}
                    onChange={(e) => {
                      setIsRecipeSlugManuallyEdited(true);
                      setRecipeFormData({ ...recipeFormData, slug: e.target.value });
                    }}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Вводная часть / Описание рецепта</label>
                <textarea
                  rows={2}
                  placeholder="Короткий аппетитный рассказ о блюде и почему наш деликатес делает его особенным..."
                  value={recipeFormData.description}
                  onChange={(e) => setRecipeFormData({ ...recipeFormData, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              {/* Cover Image & Video URL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Заглавная фотография рецепта</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="/images/products/..."
                      value={recipeFormData.cover_image}
                      onChange={(e) => setRecipeFormData({ ...recipeFormData, cover_image: e.target.value })}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                    <label
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                    >
                      <Upload size={14} />
                      <span>Загрузить</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleRecipeCoverUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Видео приготовления (YouTube / RuTube)</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={recipeFormData.video_url}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, video_url: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Meta: Prep time, Portions, Difficulty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Время приготовления</label>
                  <input
                    type="text"
                    placeholder="30-40 мин"
                    value={recipeFormData.prep_time}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, prep_time: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Порции</label>
                  <input
                    type="text"
                    placeholder="4 порции"
                    value={recipeFormData.portions}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, portions: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Сложность</label>
                  <select
                    value={recipeFormData.difficulty}
                    onChange={(e) => setRecipeFormData({ ...recipeFormData, difficulty: e.target.value })}
                    className="form-input"
                  >
                    <option value="Легко">Легко</option>
                    <option value="Средне">Средне</option>
                    <option value="Мастер">Мастер</option>
                  </select>
                </div>
              </div>

              {/* CONSTRUCTOR: INGREDIENTS */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-craft)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--bg-dark)' }}>
                    Список ингредиентов ({recipeFormData.ingredients.length})
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      setRecipeFormData((prev) => ({
                        ...prev,
                        ingredients: [...prev.ingredients, { name: '', amount: '' }],
                      }))
                    }
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    + Добавить ингредиент
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recipeFormData.ingredients.map((ing, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Название (например: Сливочное масло)"
                        value={ing.name}
                        onChange={(e) => {
                          const next = [...recipeFormData.ingredients];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setRecipeFormData({ ...recipeFormData, ingredients: next });
                        }}
                        className="form-input"
                        style={{ flex: 2 }}
                      />
                      <input
                        type="text"
                        placeholder="Кол-во (например: 30 г)"
                        value={ing.amount}
                        onChange={(e) => {
                          const next = [...recipeFormData.ingredients];
                          next[idx] = { ...next[idx], amount: e.target.value };
                          setRecipeFormData({ ...recipeFormData, ingredients: next });
                        }}
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRecipeFormData((prev) => ({
                            ...prev,
                            ingredients: prev.ingredients.filter((_, i) => i !== idx),
                          }))
                        }
                        style={{
                          background: '#FFF0F0',
                          border: '1px solid #F5C6CB',
                          borderRadius: '6px',
                          color: 'var(--accent-red)',
                          padding: '8px',
                          cursor: 'pointer',
                        }}
                        title="Удалить строку"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONSTRUCTOR: STEPS */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-craft)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--bg-dark)' }}>
                      Пошаговая инструкция приготовления ({recipeFormData.steps.length} шагов)
                    </strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      К каждому шагу можно прикрепить отдельное фото процесса и секрет мастера Дмитрия.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRecipeFormData((prev) => ({
                        ...prev,
                        steps: [
                          ...prev.steps,
                          {
                            step_number: prev.steps.length + 1,
                            title: `Шаг ${prev.steps.length + 1}`,
                            description: '',
                            image_url: '',
                            tip: '',
                          },
                        ],
                      }))
                    }
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    + Добавить шаг
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {recipeFormData.steps.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-craft)',
                        border: '1px solid var(--border-craft)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'var(--accent-copper)',
                              color: '#FFFFFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="Заголовок шага (например: Обжарка лука и моркови)"
                            value={step.title}
                            onChange={(e) => {
                              const next = [...recipeFormData.steps];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setRecipeFormData({ ...recipeFormData, steps: next });
                            }}
                            className="form-input"
                            style={{ fontWeight: 600, background: '#FFFFFF', minWidth: '280px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const next = [...recipeFormData.steps];
                              const temp = next[idx - 1];
                              next[idx - 1] = next[idx];
                              next[idx] = temp;
                              setRecipeFormData({ ...recipeFormData, steps: next });
                            }}
                            style={{ padding: '4px 6px', background: '#FFFFFF', border: '1px solid #CCC', borderRadius: '4px', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}
                            title="Сдвинуть вверх"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === recipeFormData.steps.length - 1}
                            onClick={() => {
                              if (idx === recipeFormData.steps.length - 1) return;
                              const next = [...recipeFormData.steps];
                              const temp = next[idx + 1];
                              next[idx + 1] = next[idx];
                              next[idx] = temp;
                              setRecipeFormData({ ...recipeFormData, steps: next });
                            }}
                            style={{ padding: '4px 6px', background: '#FFFFFF', border: '1px solid #CCC', borderRadius: '4px', cursor: idx === recipeFormData.steps.length - 1 ? 'default' : 'pointer', opacity: idx === recipeFormData.steps.length - 1 ? 0.4 : 1 }}
                            title="Сдвинуть вниз"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRecipeFormData((prev) => ({
                                ...prev,
                                steps: prev.steps.filter((_, i) => i !== idx),
                              }))
                            }
                            style={{ padding: '4px 6px', background: '#FFF0F0', border: '1px solid #F5C6CB', borderRadius: '4px', color: 'var(--accent-red)', cursor: 'pointer' }}
                            title="Удалить шаг"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '10px' }}>
                        <textarea
                          rows={2}
                          placeholder="Подробная инструкция шага..."
                          value={step.description}
                          onChange={(e) => {
                            const next = [...recipeFormData.steps];
                            next[idx] = { ...next[idx], description: e.target.value };
                            setRecipeFormData({ ...recipeFormData, steps: next });
                          }}
                          className="form-textarea"
                          style={{ background: '#FFFFFF' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                            Фотография этого шага:
                          </label>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="/images/recipes/..."
                              value={step.image_url || ''}
                              onChange={(e) => {
                                const next = [...recipeFormData.steps];
                                next[idx] = { ...next[idx], image_url: e.target.value };
                                setRecipeFormData({ ...recipeFormData, steps: next });
                              }}
                              className="form-input"
                              style={{ background: '#FFFFFF', padding: '6px 8px', fontSize: '12px' }}
                            />
                            <label
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid var(--border-craft)',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Upload size={12} />
                              <span>Загрузить</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleStepImageUpload(idx, e)}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--accent-copper)', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                            💡 Секрет мастера Дмитрия (необязательно):
                          </label>
                          <input
                            type="text"
                            placeholder="Например: Не солите слишком рано..."
                            value={step.tip || ''}
                            onChange={(e) => {
                              const next = [...recipeFormData.steps];
                              next[idx] = { ...next[idx], tip: e.target.value };
                              setRecipeFormData({ ...recipeFormData, steps: next });
                            }}
                            className="form-input"
                            style={{ background: '#FFFFFF', padding: '6px 8px', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  {editingRecipe ? 'Сохранить изменения рецепта' : 'Опубликовать рецепт'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
