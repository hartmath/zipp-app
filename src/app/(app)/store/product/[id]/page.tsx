'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { addToCart, openCartDrawer } from '@/lib/cart';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { id } = await params;
      if (!supabase) return;
      setLoading(true);
      const { data } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', id)
        .single();
      setProduct(data);
      setLoading(false);
    };
    load();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">Product not found</div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto p-4">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>Back</Button>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            {product.image_url && (
              <div className="w-full h-72 bg-gray-800 overflow-hidden rounded-t-lg">
                <Image src={product.image_url} alt={product.name} width={1200} height={600} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <h1 className="text-xl font-bold mb-1">{product.name}</h1>
              <p className="text-gray-400 mb-3">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-teal-400 font-bold text-lg">${product.price}</span>
                <Button
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.image_url }, 1);
                    openCartDrawer();
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


