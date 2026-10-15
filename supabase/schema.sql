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

-- ---------- Textes + infos établissement (clé/valeur) ----------
create table if not exists site_content (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
alter table site_content enable row level security;
drop policy if exists "public read content" on site_content;
drop policy if exists "admin write content" on site_content;
create policy "public read content" on site_content for select using (true);
create policy "admin write content" on site_content for all to authenticated using (true) with check (true);

-- ---------- Galerie ----------
create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table gallery enable row level security;
drop policy if exists "public read gallery" on gallery;
drop policy if exists "admin write gallery" on gallery;
create policy "public read gallery" on gallery for select using (true);
create policy "admin write gallery" on gallery for all to authenticated using (true) with check (true);

-- ---------- Services (cartes de la section "Nos Services") ----------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text,
  icon text default 'fas fa-star',
  image_url text,
  visible boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table services enable row level security;
drop policy if exists "public read services" on services;
drop policy if exists "admin write services" on services;
create policy "public read services" on services for select using (true);
create policy "admin write services" on services for all to authenticated using (true) with check (true);
