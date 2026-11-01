-- AM Digital Agency v2 – NEW sections. If you already ran schema.sql earlier, run ONLY this file.
-- (A fresh install can run schema.sql alone: it already contains this block.)
create table if not exists public.artworks (id uuid primary key default gen_random_uuid(), title text not null, description text default '', image_url text default '', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.experience (id uuid primary key default gen_random_uuid(), role text not null, company text default '', period text default '', description text default '', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.skills (id uuid primary key default gen_random_uuid(), name text not null, level int default 80 check (level between 0 and 100), sort_order int default 0, created_at timestamptz default now());
create table if not exists public.testimonials (id uuid primary key default gen_random_uuid(), name text not null, role text default '', quote text default '', image_url text default '', rating int default 5 check (rating between 1 and 5), sort_order int default 0, created_at timestamptz default now());
create table if not exists public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text default '', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.stats (id uuid primary key default gen_random_uuid(), label text not null, value int default 0, suffix text default '+', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.custom_sections (id uuid primary key default gen_random_uuid(), title text not null, subtitle text default '', layout text default 'gallery' check (layout in ('gallery','list','timeline')), visible text default 'yes', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.custom_items (id uuid primary key default gen_random_uuid(), section_id uuid references public.custom_sections(id) on delete cascade, title text not null, text text default '', image_url text default '', sort_order int default 0, created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['artworks','experience','skills','testimonials','faqs','stats','custom_sections','custom_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Allow photos AND videos (up to 50 MB) in the images bucket
update storage.buckets set file_size_limit = 52428800, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'] where id = 'images';
