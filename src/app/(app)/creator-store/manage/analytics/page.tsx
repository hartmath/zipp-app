'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StoreAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ d7: number; d30: number; all: number }>({ d7: 0, d30: 0, all: 0 });
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: store } = await supabase.from('creator_stores').select('id').eq('user_id', user.id).single();
      if (!store?.id) { setLoading(false); return; }
      setStoreId(store.id);

      const now = new Date();
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: oAll }, { data: o7 }, { data: o30 }] = await Promise.all([
        supabase.from('orders').select('amount_cents').eq('store_id', store.id).eq('status', 'paid'),
        supabase.from('orders').select('amount_cents').eq('store_id', store.id).eq('status', 'paid').gte('created_at', d7),
        supabase.from('orders').select('amount_cents').eq('store_id', store.id).eq('status', 'paid').gte('created_at', d30),
      ]);

      const sum = (rows?: { amount_cents: number }[]) => (rows || []).reduce((s, r) => s + (Number(r.amount_cents) || 0), 0) / 100;
      setTotals({ all: sum(oAll as any), d7: sum(o7 as any), d30: sum(o30 as any) });

      const { data: latest } = await supabase
        .from('orders')
        .select('id, amount_cents, currency, status, created_at')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setOrders(latest || []);
      setLoading(false);
    };
    load();
  }, [router]);

  return (
    <div className="h-full overflow-y-auto bg-black text-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Store Analytics</h1>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : !storeId ? (
        <div>No store found.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-4"><div className="text-xs text-gray-400">Last 7 days</div><div className="text-2xl font-bold">${totals.d7.toFixed(2)}</div></CardContent></Card>
            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-4"><div className="text-xs text-gray-400">Last 30 days</div><div className="text-2xl font-bold">${totals.d30.toFixed(2)}</div></CardContent></Card>
            <Card className="bg-gray-900 border-gray-800"><CardContent className="p-4"><div className="text-xs text-gray-400">All time</div><div className="text-2xl font-bold">${totals.all.toFixed(2)}</div></CardContent></Card>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Recent Orders</div>
              <div className="space-y-2">
                {orders.length === 0 ? (
                  <div className="text-xs text-gray-400">No orders yet.</div>
                ) : orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-xs">
                    <span>#{o.id.slice(0,8)}</span>
                    <span className="text-gray-400">{new Date(o.created_at).toLocaleString()}</span>
                    <span className="font-medium">${(Number(o.amount_cents)||0/100).toFixed(2)}</span>
                    <span className="uppercase text-gray-400">{o.currency}</span>
                    <span className="capitalize">{o.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


