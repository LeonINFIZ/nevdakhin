import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';

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
      sort_order,
    } = body;

    const stmt = db.prepare(`
      UPDATE products
      SET category_id = COALESCE(?, category_id),
          subcategory_id = ?,
          title = COALESCE(?, title),
          slug = COALESCE(?, slug),
          description = COALESCE(?, description),
          composition = COALESCE(?, composition),
          weight = COALESCE(?, weight),
          storage = COALESCE(?, storage),
          price = COALESCE(?, price),
          old_price = ?,
          images = COALESCE(?, images),
          in_stock = COALESCE(?, in_stock),
          badge = ?,
          sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `);

    stmt.run(
      category_id,
      subcategory_id !== undefined ? subcategory_id : null,
      title,
      slug,
      description,
      composition,
      weight,
      storage,
      price !== undefined ? parseFloat(price) : null,
      old_price !== undefined ? (old_price ? parseFloat(old_price) : null) : null,
      images !== undefined ? JSON.stringify(images) : null,
      in_stock !== undefined ? Number(in_stock) : null,
      badge !== undefined ? badge : null,
      sort_order,
      id
    );

    return NextResponse.json({ success: true });
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
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
