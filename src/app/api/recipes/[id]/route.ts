import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { transliterateToSlug } from '@/lib/slug';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const r = db
      .prepare(`
        SELECT 
          r.*,
          p.title as product_title,
          p.price as product_price,
          p.weight as product_weight,
          p.images as product_images
        FROM recipes r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.id = ?
      `)
      .get(id) as any;

    if (!r) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 });
    }

    let productImages: string[] = [];
    try {
      productImages = JSON.parse(r.product_images || '[]');
    } catch {
      productImages = [];
    }

    return NextResponse.json({
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
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const { id } = await params;
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
      sort_order,
    } = body;

    const current = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as any;
    if (!current) {
      return NextResponse.json({ error: 'Рецепт не найден' }, { status: 404 });
    }

    const cleanSlug = slug
      ? transliterateToSlug(slug)
      : title
      ? transliterateToSlug(title)
      : current.slug;

    const stmt = db.prepare(`
      UPDATE recipes
      SET product_id = ?,
          title = COALESCE(?, title),
          slug = COALESCE(?, slug),
          description = COALESCE(?, description),
          cover_image = COALESCE(?, cover_image),
          video_url = COALESCE(?, video_url),
          prep_time = COALESCE(?, prep_time),
          portions = COALESCE(?, portions),
          difficulty = COALESCE(?, difficulty),
          ingredients = COALESCE(?, ingredients),
          steps = COALESCE(?, steps),
          is_active = COALESCE(?, is_active),
          sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `);

    stmt.run(
      product_id !== undefined ? (product_id ? Number(product_id) : null) : current.product_id,
      title ? title.trim() : null,
      cleanSlug,
      description !== undefined ? description : null,
      cover_image !== undefined ? cover_image : null,
      video_url !== undefined ? video_url : null,
      prep_time !== undefined ? prep_time : null,
      portions !== undefined ? portions : null,
      difficulty !== undefined ? difficulty : null,
      ingredients !== undefined ? JSON.stringify(ingredients) : null,
      steps !== undefined ? JSON.stringify(steps) : null,
      is_active !== undefined ? Number(is_active) : null,
      sort_order !== undefined ? Number(sort_order) : null,
      id
    );

    return NextResponse.json({ success: true, slug: cleanSlug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const { id } = await params;
    db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
