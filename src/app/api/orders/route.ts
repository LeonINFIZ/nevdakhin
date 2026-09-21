import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { geocodeAndCalculateDistance, DELIVERY_RULES } from '@/lib/dadata';
import { Order, OrderItem } from '@/types';

export async function GET(request: Request) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY id DESC';

    const orders = db.prepare(query).all(...params) as Order[];

    // Fetch order items for each order
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    for (const order of orders) {
      order.items = getItems.all(order.id) as OrderItem[];
    }

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_comment,
      delivery_type, // 'pickup' | 'delivery'
      delivery_address,
      items, // array of { product_id, quantity }
      payment_method, // 'cash_on_delivery', 'card_on_delivery'
    } = body;

    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Укажите имя и контактный телефон' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Корзина пуста' }, { status: 400 });
    }

    // Verify products and calculate subtotal
    let subtotal = 0;
    const verifiedItems: {
      product_id: number;
      title: string;
      price: number;
      weight: string;
      quantity: number;
      subtotal: number;
    }[] = [];

    const getProduct = db.prepare('SELECT id, title, price, weight FROM products WHERE id = ? AND in_stock = 1');

    for (const item of items) {
      const prod = getProduct.get(item.product_id) as any;
      if (!prod) {
        return NextResponse.json({ error: `Товар с ID ${item.product_id} не доступен` }, { status: 400 });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSubtotal = prod.price * qty;
      subtotal += itemSubtotal;

      verifiedItems.push({
        product_id: prod.id,
        title: prod.title,
        price: prod.price,
        weight: prod.weight || '',
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    let deliveryCost = 0;
    let distanceKm: number | null = null;
    let deliveryLat: number | null = null;
    let deliveryLon: number | null = null;
    let finalAddress = delivery_address;

    if (delivery_type === 'delivery') {
      if (!delivery_address || !delivery_address.trim()) {
        return NextResponse.json({ error: 'Укажите адрес доставки' }, { status: 400 });
      }

      // Geocode and verify distance
      const geo = await geocodeAndCalculateDistance(delivery_address, subtotal);
      if (!geo.isEligible) {
        return NextResponse.json(
          {
            error: geo.reason || `Доставка доступна только в радиусе ${DELIVERY_RULES.radiusKm} км от производства (д. Бурцево).`,
            distanceKm: geo.distanceKm,
            isBeyondRadius: true,
          },
          { status: 400 }
        );
      }

      distanceKm = geo.distanceKm;
      deliveryLat = geo.lat;
      deliveryLon = geo.lon;
      finalAddress = geo.formattedAddress;
      deliveryCost = geo.deliveryCost;
    }

    const totalAmount = subtotal + deliveryCost;

    // Generate order number: #ND-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#ND-${randomSuffix}`;

    // Execute SQLite transaction
    const insertOrderTransaction = db.transaction(() => {
      const orderStmt = db.prepare(`
        INSERT INTO orders (
          order_number, customer_name, customer_phone, customer_comment,
          delivery_type, delivery_address, delivery_lat, delivery_lon,
          delivery_distance_km, delivery_cost, subtotal, total_amount,
          payment_method, payment_status, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'new')
      `);

      const orderInfo = orderStmt.run(
        orderNumber,
        customer_name.trim(),
        customer_phone.trim(),
        customer_comment || null,
        delivery_type,
        finalAddress || null,
        deliveryLat,
        deliveryLon,
        distanceKm,
        deliveryCost,
        subtotal,
        totalAmount,
        payment_method || 'cash_on_delivery'
      );

      const orderId = Number(orderInfo.lastInsertRowid);

      const itemStmt = db.prepare(`
        INSERT INTO order_items (order_id, product_id, title, price, weight, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const it of verifiedItems) {
        itemStmt.run(orderId, it.product_id, it.title, it.price, it.weight, it.quantity, it.subtotal);
      }

      return { orderId, orderNumber, totalAmount, deliveryCost, subtotal };
    });

    const result = insertOrderTransaction();

    return NextResponse.json({
      success: true,
      order: {
        id: result.orderId,
        order_number: result.orderNumber,
        subtotal: result.subtotal,
        delivery_cost: result.deliveryCost,
        total_amount: result.totalAmount,
        delivery_type,
        distance_km: distanceKm,
      },
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
