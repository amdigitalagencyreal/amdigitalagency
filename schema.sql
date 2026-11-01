-- AM Digital Agency – run this whole file once in Supabase → SQL Editor.
create extension if not exists pgcrypto;

-- Admin allow-list (only users listed here can change content)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(), icon text default '⭐', title text not null,
  description text default '', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(), title text not null, category text default 'Video Editing',
  image_url text default '', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(), name text not null, price text default 'Contact for price',
  features text default '', sort_order int default 0, created_at timestamptz default now());
create table if not exists public.site_settings (key text primary key, value text default '');
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(), name text not null, contact text not null,
  service text default '', message text default '', status text default 'new',
  created_at timestamptz default now());

-- Row Level Security
alter table public.admins enable row level security;
create policy "admins read own row" on public.admins for select to authenticated using (user_id = auth.uid());

do $$ declare t text; begin
  foreach t in array array['services','portfolio','packages','site_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table public.inquiries enable row level security;
create policy "anyone can submit" on public.inquiries for insert to anon, authenticated
  with check (length(name) between 1 and 120 and length(contact) between 1 and 160 and length(message) <= 2000 and status = 'new');
create policy "admin read" on public.inquiries for select to authenticated using (public.is_admin());
create policy "admin update" on public.inquiries for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete" on public.inquiries for delete to authenticated using (public.is_admin());

-- Storage bucket for images (public read, admin-only write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 52428800, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;

create policy "images public read" on storage.objects for select to anon, authenticated using (bucket_id = 'images');
create policy "images admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'images' and public.is_admin());
create policy "images admin update" on storage.objects for update to authenticated using (bucket_id = 'images' and public.is_admin());
create policy "images admin delete" on storage.objects for delete to authenticated using (bucket_id = 'images' and public.is_admin());

-- Starter content (matches the current website)
insert into public.services (icon, title, description, sort_order) values
 ('🎬','Video Editing','Reels, TikToks and Shorts edited to hold attention.',1),
 ('🎨','Graphic Design','Posters, banners and ads with a premium finish.',2),
 ('📱','Social Media Design','Post and reel designs that match your brand.',3),
 ('🚀','Branding & Growth','Social media branding and growth strategy.',4),
 ('📣','Promotion Services','Facebook, Instagram and TikTok followers, likes, comments, views and promotion.',5),
 ('🧩','Custom Marketing','Digital marketing built around your goals.',6);
insert into public.packages (name, price, features, sort_order) values
 ('Starter','Contact for price', E'Social media posts\nBasic edits\nFast delivery',1),
 ('Growth','Contact for price', E'Reels and video editing\nAd creatives\nBrand styling',2),
 ('Premium','Contact for price', E'Full content package\nGrowth and promotion\nPriority support',3);
insert into public.site_settings (key, value) values
 ('tagline','Your Vision, Our Creativity – Your Success, Our Mission'),
 ('phrases', E'scroll-stopping Reels\neye-catching designs\nhigh-converting ads\nbrands that grow'),
 ('hero_text','Video editing, design, advertising and social media growth for brands that want to stand out.'),
 ('about_title','Your Digital Growth Partner'),
 ('about_text','Built for small businesses, entrepreneurs, online sellers, influencers, creators and startups. Your vision is our creativity, your success is our mission.'),
 ('whatsapp','923324211942'),
 ('email','amanuddin1001@gmail.com'),
 ('facebook','https://www.facebook.com/share/1AQNwprH4e/'),
 ('instagram','https://www.instagram.com/amdigitalagency.real/')
on conflict (key) do nothing;

-- AFTER creating your admin user in Authentication → Users, run (with YOUR email):
-- insert into public.admins (user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
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
