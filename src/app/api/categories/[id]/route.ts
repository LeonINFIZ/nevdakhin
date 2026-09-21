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
    const { name, slug, description, sort_order, is_active, subcategories } = body;

    const stmt = db.prepare(`
      UPDATE categories
      SET name = COALESCE(?, name),
          slug = COALESCE(?, slug),
          description = COALESCE(?, description),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);

    stmt.run(name, slug, description, sort_order, is_active, id);

    // If subcategories list is passed, synchronize subcategories
    if (Array.isArray(subcategories)) {
      // Remove old subcategories
      db.prepare('DELETE FROM subcategories WHERE category_id = ?').run(id);

      const insertSub = db.prepare(`
        INSERT INTO subcategories (category_id, name, slug, sort_order)
        VALUES (?, ?, ?, ?)
      `);

      subcategories.forEach((sub: any, idx: number) => {
        const subName = typeof sub === 'string' ? sub : sub.name;
        if (subName && subName.trim()) {
          const subSlug = `${slug || 'cat'}-${idx + 1}`;
          insertSub.run(id, subName.trim(), subSlug, idx + 1);
        }
      });
    }

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
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
