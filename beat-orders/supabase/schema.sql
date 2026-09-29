-- Beat Orders – Supabase setup
-- Supabase Dashboard → SQL Editor → paste this → Run.

-- 1) Orders table (one JSON document per order, only visible to its owner)
create table if not exists public.orders (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Private storage bucket for audio / presets
insert into storage.buckets (id, name, public)
values ('beats', 'beats', false)
on conflict (id) do nothing;

-- Files live under "<user id>/<file id>" – each user only sees their own folder.
drop policy if exists "own beats read" on storage.objects;
drop policy if exists "own beats write" on storage.objects;
drop policy if exists "own beats update" on storage.objects;
drop policy if exists "own beats delete" on storage.objects;

create policy "own beats read" on storage.objects for select
  using (bucket_id = 'beats' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own beats write" on storage.objects for insert
  with check (bucket_id = 'beats' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own beats update" on storage.objects for update
  using (bucket_id = 'beats' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own beats delete" on storage.objects for delete
  using (bucket_id = 'beats' and (storage.foldername(name))[1] = auth.uid()::text);
