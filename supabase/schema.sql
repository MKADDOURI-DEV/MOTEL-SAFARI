-- Motel Safari Budget — schéma admin (idempotent: peut être relancé sans risque)

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  description text,
  image_url text,
  images text[] default '{}',
  features text[] default '{}',
  visible boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table rooms add column if not exists images text[] default '{}';
alter table rooms add column if not exists features text[] default '{}';

alter table rooms enable row level security;

drop policy if exists "public read rooms" on rooms;
drop policy if exists "admin write rooms" on rooms;
create policy "public read rooms" on rooms for select using (true);
create policy "admin write rooms" on rooms for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public) values ('rooms', 'rooms', true)
on conflict (id) do nothing;

drop policy if exists "public read images" on storage.objects;
drop policy if exists "admin upload images" on storage.objects;
create policy "public read images" on storage.objects for select using (bucket_id = 'rooms');
create policy "admin upload images" on storage.objects for all to authenticated
  using (bucket_id = 'rooms') with check (bucket_id = 'rooms');
