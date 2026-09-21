import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { Order, OrderItem } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | undefined;

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as OrderItem[];

    return NextResponse.json(order);
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
    const { status, payment_status, customer_comment } = body;

    const stmt = db.prepare(`
      UPDATE orders
      SET status = COALESCE(?, status),
          payment_status = COALESCE(?, payment_status),
          customer_comment = COALESCE(?, customer_comment)
      WHERE id = ?
    `);

    stmt.run(status, payment_status, customer_comment, id);

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
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
