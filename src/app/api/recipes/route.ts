import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { Recipe } from '@/types';
import { transliterateToSlug } from '@/lib/slug';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const productId = searchParams.get('product_id');
    const admin = searchParams.get('admin');

    let query = `
      SELECT 
        r.*,
        p.title as product_title,
        p.price as product_price,
        p.weight as product_weight,
        p.images as product_images
      FROM recipes r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!admin) {
      query += ' AND r.is_active = 1';
    }

    if (slug) {
      query += ' AND r.slug = ?';
      params.push(slug);
    }

    if (productId) {
      query += ' AND r.product_id = ?';
      params.push(productId);
    }

    query += ' ORDER BY r.sort_order ASC, r.id DESC';

    const rows = db.prepare(query).all(...params) as any[];

    const recipes: Recipe[] = rows.map((r) => {
      let productImages: string[] = [];
      try {
        productImages = JSON.parse(r.product_images || '[]');
      } catch {
        productImages = [];
      }

      return {
        id: r.id,
        product_id: r.product_id,
        product_title: r.product_title,
        product_price: r.product_price,
        product_weight: r.product_weight,
        product_image: productImages[0] || r.cover_image,
        title: r.title,
        slug: r.slug,
        description: r.description || '',
        cover_image: r.cover_image,
        video_url: r.video_url || '',
        prep_time: r.prep_time || '45 мин',
        portions: r.portions || '4 порции',
        difficulty: r.difficulty || 'Средне',
        ingredients: JSON.parse(r.ingredients || '[]'),
        steps: JSON.parse(r.steps || '[]'),
        is_active: r.is_active,
        sort_order: r.sort_order,
        created_at: r.created_at,
      };
    });

    if (slug) {
      if (recipes.length === 0) {
        return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 });
      }
      return NextResponse.json(recipes[0]);
    }

    return NextResponse.json(recipes);
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
      product_id,
      title,
      slug,
      description,
      cover_image,
      video_url,
      prep_time,
      portions,
      difficulty,
      ingredients,
      steps,
      is_active,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Название рецепта обязательно' }, { status: 400 });
    }

    const cleanSlug = transliterateToSlug(slug || title);
    if (!cleanSlug) {
      return NextResponse.json({ error: 'Не удалось сформировать слаг рецепта' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = db.prepare('SELECT id FROM recipes WHERE slug = ?').get(cleanSlug);
    if (existing) {
      return NextResponse.json({ error: 'Рецепт с таким URL-слагом уже существует' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO recipes (
        product_id, title, slug, description, cover_image, video_url,
        prep_time, portions, difficulty, ingredients, steps, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM recipes))
    `);

    const info = stmt.run(
      product_id ? Number(product_id) : null,
      title.trim(),
      cleanSlug,
      description || '',
      cover_image || '/images/products/tushenka.jpg',
      video_url || '',
      prep_time || '45 мин',
      portions || '4 порции',
      difficulty || 'Средне',
      JSON.stringify(ingredients || []),
      JSON.stringify(steps || []),
      is_active !== undefined ? Number(is_active) : 1
    );

    return NextResponse.json({ success: true, id: Number(info.lastInsertRowid), slug: cleanSlug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
