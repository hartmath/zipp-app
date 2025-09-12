"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (!profile?.is_admin) {
        router.push('/admin/login');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <div className="p-4 text-white">Loading...</div>;
  if (!isAdmin) return null;

  return (
    <div className="p-4 text-white space-y-4">
      <h1 className="text-lg font-semibold">Admin</h1>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-teal-600">Overview</TabsTrigger>
          <TabsTrigger value="stores" className="data-[state=active]:bg-teal-600">Stores</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-teal-600">Products</TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-teal-600">Orders</TabsTrigger>
          <TabsTrigger value="music" className="data-[state=active]:bg-teal-600">Music</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-sm text-white/80">
              Quick moderation tools and analytics will appear here.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="mt-4">
          <AdminStores />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <AdminProducts />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <AdminOrders />
        </TabsContent>

        <TabsContent value="music" className="mt-4">
          <AdminMusic />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminStores() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      const { data } = await supabase.from('creator_stores').select('*').order('created_at', { ascending: false });
      setRows(data || []);
      setLoading(false);
    };
    load();
  }, []);
  const togglePublic = async (row: any) => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    await supabase.from('creator_stores').update({ is_public: !row.is_public }).eq('id', row.id);
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, is_public: !x.is_public } : x)));
  };
  return (
    <div className="space-y-3">
      {loading ? <div>Loading stores...</div> : rows.length === 0 ? <div>No stores.</div> : (
        rows.map((s) => (
          <Card key={s.id} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.business_name || s.name || s.id}</div>
                <div className="text-xs text-white/60">Public: {String(!!s.is_public)} | Open: {String(!!s.is_store_open)}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => togglePublic(s)}>
                  Toggle Public
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function AdminMusic() {
  const [categories, setCategories] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<{ title: string; artist: string; category_id: string }>({ title: '', artist: '', category_id: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: cats }, { data: trks }] = await Promise.all([
        supabase.from('music_categories').select('*').order('name'),
        supabase.from('music_tracks').select('*').order('created_at', { ascending: false }),
      ]);
      setCategories(cats || []);
      setTracks(trks || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem('file') as HTMLInputElement);
    const file = input?.files?.[0];
    if (!file || !form.title) return;
    setUploading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const filePath = `admin/${Date.now()}_${file.name}`;
      const { error: upErr } = await (supabase.storage as any).from('music').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('music_tracks').insert({
        title: form.title,
        artist: form.artist || null,
        category_id: form.category_id || null,
        file_path: filePath,
        uploaded_by: user?.id || null,
        is_public: true,
      });
      const { data: trks } = await supabase.from('music_tracks').select('*').order('created_at', { ascending: false });
      setTracks(trks || []);
      setForm({ title: '', artist: '', category_id: '' });
      input.value = '';
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium">Upload Track</h3>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <input className="bg-gray-800 text-white px-3 py-2 rounded" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="bg-gray-800 text-white px-3 py-2 rounded" placeholder="Artist (optional)" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
            <select className="bg-gray-800 text-white px-3 py-2 rounded" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input name="file" type="file" accept="audio/*" className="text-sm" />
              <Button type="submit" disabled={uploading} className="bg-teal-600 hover:bg-teal-700">{uploading ? 'Uploading…' : 'Upload'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          {loading ? <div>Loading...</div> : tracks.length === 0 ? <div>No tracks.</div> : (
            <div className="space-y-2">
              {tracks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="truncate">{t.title} {t.artist ? `— ${t.artist}` : ''}</div>
                  <a className="text-teal-400 hover:underline" href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/music/${t.file_path}`} target="_blank">Open</a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminProducts() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      const { data } = await supabase.from('store_products').select('*').order('created_at', { ascending: false });
      setRows(data || []);
      setLoading(false);
    };
    load();
  }, []);
  const toggleAvailable = async (row: any) => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    
    await supabase.from('store_products').update({ is_available: !row.is_available }).eq('id', row.id);
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, is_available: !x.is_available } : x)));
  };
  return (
    <div className="space-y-3">
      {loading ? <div>Loading products...</div> : rows.length === 0 ? <div>No products.</div> : (
        rows.map((p) => (
          <Card key={p.id} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-white/60">Available: {String(!!p.is_available)} | Price: {p.price} {p.currency}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => toggleAvailable(p)}>
                  Toggle Available
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function AdminOrders() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setRows(data || []);
      setLoading(false);
    };
    load();
  }, []);
  return (
    <div className="space-y-3">
      {loading ? <div>Loading orders...</div> : rows.length === 0 ? <div>No orders.</div> : (
        rows.map((o) => (
          <Card key={o.id} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">Order {o.id}</div>
                <div className="text-xs text-white/60">Status: {o.status} | Amount: {o.amount_total} {o.currency}</div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
