'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ShoppingBag, Star, Heart, Search, Plus, Store, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LogoLarge } from '@/components/common/logo';
import { getPublicStores, searchStores, getPublicProducts, searchProducts, getUserStore, getStoreProducts } from '@/lib/store-utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { getCartCount, subscribeToCart, addToCart, openCartDrawer } from '@/lib/cart';

const navItems = [
    { href: '/events', label: 'Events' },
    { href: '/zippers', label: 'Zippers' },
    { href: '/store', label: 'Store' },
    { href: '/home', label: 'For You' },
    { href: '/live', label: 'Live' },
];

function ShopHeader() {
    const pathname = usePathname();
  const [hasStore, setHasStore] = React.useState(false);
  const [cartCount, setCartCount] = React.useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;
    setCartCount(getCartCount());
    const unsub = subscribeToCart((count) => setCartCount(count));
    const checkStore = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setHasStore(false);
          return;
        }
        const { data } = await supabase
          .from('creator_stores')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (isMounted) setHasStore(!!data?.id);
      } catch {
        if (isMounted) setHasStore(false);
      }
    };
    checkStore();
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

    return (
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 text-white">
            <div className="flex items-center gap-4 pl-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'text-xs font-medium transition-colors',
                            pathname === item.href
                                ? 'text-white border-b-2 border-white pb-0.5'
                                : 'text-white/60 hover:text-white/90'
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
      <div className="flex items-center gap-2 pr-2">
        {hasStore && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-white/80 hover:bg-transparent hover:text-white" asChild>
            <Link href="/creator-store/manage">
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" className="relative h-7 w-7 p-0 text-white/80 hover:bg-transparent hover:text-white" asChild>
          <Link href="/store/cart">
                <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[10px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
              </Link>
            </Button>
      </div>
        </header>
    );
}

export default function ShopPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [myStoreId, setMyStoreId] = useState<string | null>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    const loadMine = async () => {
      setLoadingMine(true);
      const res = await getUserStore();
      if (res.success && res.data?.id) {
        setMyStoreId(res.data.id);
        const prods = await getStoreProducts(res.data.id);
        if (prods.success) setMyProducts(prods.data || []);
      } else {
        setMyStoreId(null);
        setMyProducts([]);
      }
      setLoadingMine(false);
    };
    loadMine();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    const [storesRes, productsRes] = await Promise.all([
      getPublicStores(20, 0),
      getPublicProducts(20, 0)
    ]);
    
    if (storesRes.success) {
      setStores(storesRes.data?.stores || []);
    } else {
      console.log('Store fetch result:', storesRes);
      setStores([]);
    }
    if (productsRes.success) {
      setProducts(productsRes.data?.products || []);
    } else {
      console.log('Products fetch result:', productsRes);
      setProducts([]);
    }
    
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setProductResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const [storesSearch, productsSearch] = await Promise.all([
      searchStores(query, 10),
      searchProducts(query, 10)
    ]);
    
    if (storesSearch.success) {
      setSearchResults(storesSearch.data || []);
    } else {
      console.log('Store search result:', storesSearch);
      setSearchResults([]);
    }
    if (productsSearch.success) {
      setProductResults(productsSearch.data || []);
    } else {
      console.log('Product search result:', productsSearch);
      setProductResults([]);
    }
    
    setIsSearching(false);
  };

  const displayStores = searchQuery ? searchResults : stores;
  const displayProducts = searchQuery ? productResults : products;
  const fmtCurrency = (n: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

  return (
    <div className="h-full bg-black text-white overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <ShopHeader />
      
      <div className="h-full pt-16 flex flex-col">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <LogoLarge className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold">Creator Stores</h1>
              <p className="text-gray-400 text-sm">Discover products and services from creators</p>
            </div>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search stores, products, or services..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          ) : (
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-800">
                <TabsTrigger value="products" className="data-[state=active]:bg-teal-600">Products ({displayProducts.length})</TabsTrigger>
                <TabsTrigger value="stores" className="data-[state=active]:bg-teal-600">Stores ({displayStores.length})</TabsTrigger>
                {myStoreId && (
                  <TabsTrigger value="mine" className="data-[state=active]:bg-teal-600">My Products ({myProducts.length})</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="products" className="mt-6">
                {displayProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{searchQuery ? 'No products found' : 'No products yet'}</h3>
                    <p className="text-gray-400 text-sm">{searchQuery ? 'Try different keywords' : 'Creators will add products soon.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayProducts.map((p) => (
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
                              <span className="text-teal-400 font-bold">{fmtCurrency(p.price)}</span>
                              <div className="flex items-center gap-2">
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => { addToCart({ id: p.id, name: p.name, price: p.price, image_url: p.image_url }, 1); openCartDrawer(); }}>
                                  Add to Cart
                                </Button>
                                <Button size="sm" variant="outline" className="border-gray-700 text-white hover:bg-gray-800" asChild>
                                  <Link href={`/store/product/${p.id}`} prefetch={false}>View</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stores" className="mt-6">
                {displayStores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{searchQuery ? 'No stores found' : 'No stores available'}</h3>
                    <p className="text-gray-400 text-sm">{searchQuery ? 'Try searching with different keywords' : 'Be the first to create a store!'}</p>
            </div>
          ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayStores.map((store) => (
                      <Card key={store.id} className="bg-gray-900 border-gray-800">
                        <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                      {store.profiles?.avatar_url ? (
                                <Image src={store.profiles.avatar_url} alt={store.business_name} width={48} height={48} className="w-12 h-12 object-cover" loading="lazy" />
                      ) : (
                        <Store className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{store.business_name}</CardTitle>
                              <CardDescription className="truncate">@{store.profiles?.username}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                      {store.description && (
                            <p className="text-gray-300 text-sm line-clamp-2 mb-3">{store.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{store.business_type === 'business' ? 'Business' : 'Individual'}</span>
                              <span>{store.address ? '📍 Local' : '🌐 Online'}</span>
                            </div>
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" asChild>
                              <Link href={`/store/${store.id}`} prefetch={false}>View Store</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                      </div>
                )}
              </TabsContent>

              {myStoreId && (
                <TabsContent value="mine" className="mt-6">
                  {loadingMine ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                    </div>
                  ) : myProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">You have no products yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myProducts.map((p) => (
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
                                <span className="text-teal-400 font-bold">{fmtCurrency(p.price)}</span>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => { addToCart({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, storeId: myStoreId }, 1); openCartDrawer(); }}>
                                    Add to Cart
                    </Button>
                  </div>
                </div>
                            </div>
                          </CardContent>
                        </Card>
              ))}
            </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>

        {/* Floating Create Store Button */}
        <div className="fixed bottom-20 right-4 z-50">
          <Button 
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg"
            asChild
          >
            <Link href="/creator-store/setup">
              <Plus className="w-5 h-5 mr-2" />
              Create Store
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
