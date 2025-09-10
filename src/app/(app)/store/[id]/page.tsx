'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { addToCart, openCartDrawer } from '@/lib/cart';

type Store = {
  id: string;
  business_name: string;
  description?: string | null;
  logo_url?: string | null;
  is_public?: boolean | null;
  user_id?: string | null;
  profile?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = (params?.id as string) || '';
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fmtCurrency = (value: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
    } catch {
      return `$${Number(value || 0).toFixed(2)}`;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStore = async () => {
      try {
        if (!supabase || !storeId) {
          setNotFound(true);
          return;
        }
        // Try schema variant A (business_name/user_id)
        let storeRow: any = null;
        let errA: any = null;
        try {
          const resA = await supabase
            .from('creator_stores')
            .select(`id, business_name, description, logo_url, is_public, user_id`)
            .eq('id', storeId)
            .single();
          storeRow = resA.data;
          errA = resA.error;
        } catch (e) {
          errA = e;
        }
        // Fallback to schema variant B (name/owner_id)
        if (!storeRow) {
          const resB = await supabase
            .from('creator_stores')
            .select(`id, name, description, logo_url, is_public, owner_id`)
            .eq('id', storeId)
            .single();
          if (resB.data) {
            storeRow = {
              id: resB.data.id,
              business_name: resB.data.name,
              description: resB.data.description,
              logo_url: resB.data.logo_url,
              is_public: resB.data.is_public,
              user_id: resB.data.owner_id,
            };
          }
        }

        // Last-resort fallback: select all and map
        if (!storeRow) {
          const resAll = await supabase
            .from('creator_stores')
            .select('*')
            .eq('id', storeId)
            .single();
          if (resAll.data) {
            const d: any = resAll.data;
            storeRow = {
              id: d.id,
              business_name: d.business_name ?? d.name ?? 'Store',
              description: d.description ?? null,
              logo_url: d.logo_url ?? null,
              is_public: d.is_public ?? null,
              user_id: d.user_id ?? d.owner_id ?? null,
            };
          }
        }

        if (!storeRow) { setNotFound(true); return; }

        let profile: Store['profile'] = null;
        if (storeRow.user_id) {
          const { data: p } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', storeRow.user_id)
            .single();
          if (p) profile = p as any;
        }

        if (isMounted) setStore({ ...storeRow, profile });
        // Load products for this store
        setLoadingProducts(true);
        const { data: prods } = await supabase
          .from('store_products')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_available', true)
          .order('created_at', { ascending: false });
        if (isMounted) setProducts(prods || []);
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingProducts(false);
        }
      }
    };
    fetchStore();
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-white">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading store...
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-white gap-3">
        <p className="text-sm">Store not found.</p>
        <Button variant="outline" onClick={() => router.push('/store')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stores
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black text-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-lg font-semibold">{store.business_name}</h1>
        <div className="w-10" />
      </header>

      <main className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            // Bypass optimizer for Supabase images to avoid dev 500s
            <img
              src={store.logo_url}
              alt={store.business_name}
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
            />
          ) : (
            <div className="w-14 h-14 rounded-md bg-gray-800" />
          )}
          <div>
            <p className="text-sm text-white/90">By {store.profile?.full_name || store.profile?.username || 'Unknown'}</p>
          </div>
        </div>

        {store.description && (
          <p className="text-sm text-white/80 whitespace-pre-wrap">{store.description}</p>
        )}

        <section>
          <h2 className="text-base font-semibold mb-3">Products</h2>
          {loadingProducts ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-sm text-white/70">No products available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Card key={p.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-0">
                    {p.image_url && (
                      <div className="w-full h-40 bg-gray-800 overflow-hidden rounded-t-lg">
                        <Image src={p.image_url} alt={p.name} width={640} height={320} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-semibold text-white mb-1 truncate">{p.name}</h4>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-2">{p.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-teal-400 font-bold">{fmtCurrency(p.price, p.currency || 'USD')}</span>
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => { addToCart({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, storeId: store.id }, 1); openCartDrawer(); }}>
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


