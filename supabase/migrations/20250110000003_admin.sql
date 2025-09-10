-- Admin setup: add is_admin to profiles and helper function

-- 1) Add column to profiles
alter table if exists public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2) Helper to check if current JWT user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

-- 3) Allow authenticated/anon to execute (for use in RLS expressions)
grant execute on function public.is_admin() to anon, authenticated;

-- 4) Admin read policies for key tables (select only)
-- These policies do not weaken RLS for non-admins because policies are ORed
-- and this condition only passes when is_admin() returns true for the caller.

drop policy if exists creator_stores_admin_select on public.creator_stores;
create policy creator_stores_admin_select on public.creator_stores
  for select using (public.is_admin());


drop policy if exists store_products_admin_select on public.store_products;
create policy store_products_admin_select on public.store_products
  for select using (public.is_admin());


drop policy if exists store_services_admin_select on public.store_services;
create policy store_services_admin_select on public.store_services
  for select using (public.is_admin());

-- Optional: orders admin read if orders table exists
-- Wrap in a try/catch block via DO when using psql; in migrations we assume table exists.
-- If your orders table may not exist yet, you can comment this out.

drop policy if exists orders_admin_select on public.orders;
create policy orders_admin_select on public.orders
  for select using (public.is_admin());

-- 5) Admin update/delete policies

drop policy if exists creator_stores_admin_update on public.creator_stores;
create policy creator_stores_admin_update on public.creator_stores
  for update using (public.is_admin());

drop policy if exists creator_stores_admin_delete on public.creator_stores;
create policy creator_stores_admin_delete on public.creator_stores
  for delete using (public.is_admin());


drop policy if exists store_products_admin_update on public.store_products;
create policy store_products_admin_update on public.store_products
  for update using (public.is_admin());

drop policy if exists store_products_admin_delete on public.store_products;
create policy store_products_admin_delete on public.store_products
  for delete using (public.is_admin());


drop policy if exists store_services_admin_update on public.store_services;
create policy store_services_admin_update on public.store_services
  for update using (public.is_admin());

drop policy if exists store_services_admin_delete on public.store_services;
create policy store_services_admin_delete on public.store_services
  for delete using (public.is_admin());

-- 6) Music bucket, tables, and policies
-- Create public music bucket (id=name='music')
insert into storage.buckets (id, name, public)
values ('music', 'music', true)
on conflict (id) do nothing;

-- Storage policies for music bucket (drop/create pattern)
drop policy if exists music_read on storage.objects;
create policy music_read on storage.objects
  for select using (bucket_id = 'music');

drop policy if exists music_insert_admin on storage.objects;
create policy music_insert_admin on storage.objects
  for insert with check (bucket_id = 'music' and public.is_admin());

drop policy if exists music_update_admin on storage.objects;
create policy music_update_admin on storage.objects
  for update using (bucket_id = 'music' and public.is_admin());

drop policy if exists music_delete_admin on storage.objects;
create policy music_delete_admin on storage.objects
  for delete using (bucket_id = 'music' and public.is_admin());

-- Music tables
create table if not exists public.music_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  category_id uuid references public.music_categories(id) on delete set null,
  file_path text not null,
  duration_seconds integer,
  uploaded_by uuid references public.profiles(id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.music_categories enable row level security;
alter table public.music_tracks enable row level security;

-- Categories: public read, admin write (drop/create pattern)
drop policy if exists music_categories_select_public on public.music_categories;
create policy music_categories_select_public on public.music_categories
  for select using (true);

drop policy if exists music_categories_admin_insert on public.music_categories;
create policy music_categories_admin_insert on public.music_categories
  for insert with check (public.is_admin());

drop policy if exists music_categories_admin_update on public.music_categories;
create policy music_categories_admin_update on public.music_categories
  for update using (public.is_admin());

drop policy if exists music_categories_admin_delete on public.music_categories;
create policy music_categories_admin_delete on public.music_categories
  for delete using (public.is_admin());

-- Tracks: public can read public tracks, admins can read all and write (drop/create pattern)
drop policy if exists music_tracks_select_public on public.music_tracks;
create policy music_tracks_select_public on public.music_tracks
  for select using (is_public = true or public.is_admin());

drop policy if exists music_tracks_admin_insert on public.music_tracks;
create policy music_tracks_admin_insert on public.music_tracks
  for insert with check (public.is_admin());

drop policy if exists music_tracks_admin_update on public.music_tracks;
create policy music_tracks_admin_update on public.music_tracks
  for update using (public.is_admin());

drop policy if exists music_tracks_admin_delete on public.music_tracks;
create policy music_tracks_admin_delete on public.music_tracks
  for delete using (public.is_admin());
