import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { Category, Subcategory } from '@/types';

export async function GET() {
  try {
    const categories = db
      .prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
      .all() as Category[];

    const subcategories = db
      .prepare('SELECT * FROM subcategories ORDER BY sort_order ASC, id ASC')
      .all() as Subcategory[];

    // Group subcategories under categories
    const result = categories.map((cat) => ({
      ...cat,
      subcategories: subcategories.filter((sub) => sub.category_id === cat.id),
    }));

    return NextResponse.json(result);
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
    const { name, slug, description, subcategories } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Название и слаг обязательны' }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/gi, '-');

    const stmt = db.prepare(`
      INSERT INTO categories (name, slug, description, sort_order)
      VALUES (?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM categories))
    `);
    const info = stmt.run(name.trim(), cleanSlug, description || '');
    const categoryId = Number(info.lastInsertRowid);

    if (Array.isArray(subcategories) && subcategories.length > 0) {
      const insertSub = db.prepare(`
        INSERT INTO subcategories (category_id, name, slug, sort_order)
        VALUES (?, ?, ?, ?)
      `);
      subcategories.forEach((subName: string, idx: number) => {
        if (subName && subName.trim()) {
          const subSlug = `${cleanSlug}-${idx + 1}`;
          insertSub.run(categoryId, subName.trim(), subSlug, idx + 1);
        }
      });
    }

    return NextResponse.json({ success: true, id: categoryId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
