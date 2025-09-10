'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CartItem, getCart, updateQuantity, removeFromCart, getCartTotal, clearCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const total = getCartTotal(items);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">Your Cart</h1>
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Your cart is empty.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((i) => (
              <Card key={i.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 flex items-center gap-3">
                  {i.image_url && (
                    <div className="w-16 h-16 bg-gray-800 rounded overflow-hidden">
                      <Image src={i.image_url} alt={i.name} width={64} height={64} className="w-16 h-16 object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{i.name}</div>
                    <div className="text-gray-400 text-sm">${i.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-8 px-2 border-gray-700 text-white" onClick={() => setItems(updateQuantity(i.id, i.quantity - 1))}>-</Button>
                    <span className="w-6 text-center">{i.quantity}</span>
                    <Button variant="outline" className="h-8 px-2 border-gray-700 text-white" onClick={() => setItems(updateQuantity(i.id, i.quantity + 1))}>+</Button>
                    <Button variant="outline" className="h-8 px-2 border-red-600 text-red-400 hover:bg-red-600/10" onClick={() => setItems(removeFromCart(i.id))}>Remove</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-lg">Total: <span className="text-teal-400 font-bold">${total.toFixed(2)}</span></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-gray-700 text-white" onClick={() => { clearCart(); setItems([]); }}>Clear</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => router.push('/store')}>Continue Shopping</Button>
          </div>
        </div>
      </div>
    </div>
  );
}


