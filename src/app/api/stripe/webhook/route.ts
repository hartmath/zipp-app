import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeSecret) return NextResponse.json({}, { status: 200 });

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
  const sig = req.headers.get('stripe-signature') as string;
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const amount = session.amount_total || 0;
        const currency = session.currency || 'usd';
        const metadata = session.metadata || {};
        const userId = metadata?.user_id || null;
        const storeId = metadata?.store_id || null;

        if (supabase) {
          await supabase.from('orders').insert({
            user_id: userId,
            store_id: storeId,
            amount_cents: amount,
            currency,
            status: 'paid',
            stripe_session_id: session.id,
            metadata
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // swallow errors to avoid retries storm during dev
  }

  return NextResponse.json({ received: true });
}


