import { NextResponse } from 'next/server';
import { geocodeAndCalculateDistance } from '@/lib/dadata';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, subtotal } = body;

    if (!address || typeof address !== 'string' || !address.trim()) {
      return NextResponse.json({ error: 'Укажите адрес' }, { status: 400 });
    }

    const result = await geocodeAndCalculateDistance(address, subtotal || 0);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
