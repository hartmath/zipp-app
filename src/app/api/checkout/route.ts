import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null as unknown as Stripe;

export async function POST(req: NextRequest) {
  try {
    if (!stripeSecret || !stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const body = await req.json();
    const items: Array<{ id: string; name: string; price: number; quantity: number }> = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    const line_items = items.map((i) => ({
      quantity: Math.max(1, Number(i.quantity) || 1),
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(i.price) * 100),
        product_data: {
          name: i.name,
        },
      },
    }));

    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/store/cart?status=success`,
      cancel_url: `${origin}/store/cart?status=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Checkout failed' }, { status: 500 });
  }
}


