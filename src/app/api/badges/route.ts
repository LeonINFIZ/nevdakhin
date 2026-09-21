import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const badges = db
      .prepare(`
        SELECT b.*, COUNT(p.id) as product_count
        FROM badges b
        LEFT JOIN products p ON p.badge = b.name
        GROUP BY b.id
        ORDER BY b.sort_order ASC, b.id ASC
      `)
      .all();

    return NextResponse.json(badges);
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
    const { name, bg_color, text_color, border_color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название метки обязательно' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check existing
    const existing = db.prepare('SELECT id FROM badges WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    if (existing) {
      return NextResponse.json({ error: 'Метка с таким названием уже существует' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO badges (name, bg_color, text_color, border_color, sort_order)
      VALUES (?, ?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM badges))
    `);

    const info = stmt.run(
      trimmedName,
      bg_color || '#FFF4E5',
      text_color || '#B25E09',
      border_color || '#FCD34D'
    );

    return NextResponse.json({ success: true, id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
