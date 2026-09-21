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
    const { name, bg_color, text_color, border_color } = body;

    const currentBadge = db.prepare('SELECT * FROM badges WHERE id = ?').get(id) as any;
    if (!currentBadge) {
      return NextResponse.json({ error: 'Метка не найдена' }, { status: 404 });
    }

    const trimmedName = name ? name.trim() : currentBadge.name;

    // If name changed, update products using this badge
    if (trimmedName !== currentBadge.name) {
      db.prepare('UPDATE products SET badge = ? WHERE badge = ?').run(trimmedName, currentBadge.name);
    }

    const stmt = db.prepare(`
      UPDATE badges
      SET name = ?,
          bg_color = COALESCE(?, bg_color),
          text_color = COALESCE(?, text_color),
          border_color = COALESCE(?, border_color)
      WHERE id = ?
    `);

    stmt.run(trimmedName, bg_color, text_color, border_color, id);

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
    const badge = db.prepare('SELECT name FROM badges WHERE id = ?').get(id) as { name: string } | undefined;

    if (badge) {
      // Clear badge from products
      db.prepare('UPDATE products SET badge = NULL WHERE badge = ?').run(badge.name);
      db.prepare('DELETE FROM badges WHERE id = ?').run(id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
