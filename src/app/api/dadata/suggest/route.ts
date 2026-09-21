import { NextResponse } from 'next/server';
import { suggestAddress } from '@/lib/dadata';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const suggestions = await suggestAddress(query);
    return NextResponse.json(suggestions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = body.query || body.q;

    if (!query || String(query).trim().length < 2) {
      return NextResponse.json([]);
    }

    const suggestions = await suggestAddress(String(query));
    return NextResponse.json(suggestions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
