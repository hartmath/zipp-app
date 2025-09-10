'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { CartItem, getCart, getCartTotal, subscribeToCart } from '@/lib/cart';
import Link from 'next/link';

export function MiniCartDrawer() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    setItems(getCart());
    const unsub = subscribeToCart(() => setItems(getCart()));
    const handler = () => setOpen(true);
    window.addEventListener('cart:open', handler);
    return () => {
      unsub();
      window.removeEventListener('cart:open', handler);
    };
  }, []);

  const total = getCartTotal(items);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="bg-black text-white border-l border-gray-800 w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Cart</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-gray-400">Your cart is empty.</div>
          ) : (
            items.map((i) => (
              <Card key={i.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-3 flex items-center gap-3">
                  {i.image_url && (
                    <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden">
                      <Image src={i.image_url} alt={i.name} width={48} height={48} className="w-12 h-12 object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{i.name}</div>
                    <div className="text-gray-400 text-sm">{i.quantity} × ${i.price}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-lg">Total: <span className="text-teal-400 font-bold">${total.toFixed(2)}</span></div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700" onClick={() => setOpen(false)}>
            <Link href="/store/cart">Checkout</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


