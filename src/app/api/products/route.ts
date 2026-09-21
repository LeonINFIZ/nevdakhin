import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { Product } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const subcategorySlug = searchParams.get('subcategory');
    const search = searchParams.get('search');
    const admin = searchParams.get('admin');

    let query = `
      SELECT 
        p.*, 
        c.name as category_name, 
        c.slug as category_slug,
        s.name as subcategory_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!admin) {
      query += ' AND c.is_active = 1';
    }

    if (categorySlug && categorySlug !== 'all') {
      query += ' AND c.slug = ?';
      params.push(categorySlug);
    }

    if (subcategorySlug) {
      query += ' AND s.slug = ?';
      params.push(subcategorySlug);
    }

    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.composition LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY p.sort_order ASC, p.id DESC';

    const rows = db.prepare(query).all(...params) as any[];

    const products: Product[] = rows.map((r) => ({
      ...r,
      images: JSON.parse(r.images || '[]'),
    }));

    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      category_id,
      subcategory_id,
      title,
      slug,
      description,
      composition,
      weight,
      storage,
      price,
      old_price,
      images,
      in_stock,
      badge,
    } = body;

    if (!category_id || !title || price === undefined) {
      return NextResponse.json({ error: 'Категория, название и цена обязательны' }, { status: 400 });
    }

    const autoSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/gi, '-')
      : `item-${Date.now()}`;

    const stmt = db.prepare(`
      INSERT INTO products (
        category_id, subcategory_id, title, slug, description, composition,
        weight, storage, price, old_price, images, in_stock, badge, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM products))
    `);

    const info = stmt.run(
      category_id,
      subcategory_id || null,
      title.trim(),
      autoSlug,
      description || '',
      composition || '',
      weight || '',
      storage || '',
      parseFloat(price),
      old_price ? parseFloat(old_price) : null,
      JSON.stringify(Array.isArray(images) ? images : []),
      in_stock !== undefined ? Number(in_stock) : 1,
      badge || null
    );

    return NextResponse.json({ success: true, id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
