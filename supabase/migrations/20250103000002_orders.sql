-- Orders table for recording Stripe checkouts
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.creator_stores(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'created',
  stripe_session_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_orders_store_id_created_at on public.orders(store_id, created_at desc);
create index if not exists idx_orders_user_id on public.orders(user_id);

-- RLS
alter table public.orders enable row level security;

-- Policies: creators can view their orders; users can view their own orders
drop policy if exists orders_select_creator on public.orders;
create policy orders_select_creator on public.orders
for select
using (
  exists (
    select 1 from public.creator_stores cs
    where cs.id = orders.store_id and cs.user_id = auth.uid()
  ) or user_id = auth.uid()
);

-- Insert/update via server/webhook; allow authenticated inserts as a fallback
drop policy if exists orders_insert_authenticated on public.orders;
create policy orders_insert_authenticated on public.orders
for insert
to authenticated
with check (auth.uid() = user_id);


