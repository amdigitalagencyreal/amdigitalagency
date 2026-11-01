# AM Digital Agency – React + Vite + Supabase + Netlify

Public website at `/`, secure admin panel at `/admin`. Every change saved in the admin panel shows on the public site on the next page load.

## What's new in v2
Photo AND video uploads (up to 50 MB; on Supabase's free plan the global limit is 50 MB), Artwork gallery, Experience timeline, Skills bars, Stats counters, Client reviews, FAQ and **Custom Sections** (create your own section with a gallery, list or timeline layout), plus an animated aurora background, glowing card borders, cursor spotlight, scrolling marquee, count-up numbers and a scroll progress bar. Sections with no items hide themselves, so just delete what you don't need.

**Upgrading from v1:** run only `supabase/update-v2.sql` in the Supabase SQL Editor, then `git add . && git commit -m "v2" && git push`. Netlify redeploys automatically. Optional: run `supabase/sample-data.sql` to see placeholder content, then replace it in /admin.

## 1. Supabase setup (about 10 minutes)
1. Go to https://supabase.com → **New project**. Save the database password somewhere safe.
2. **SQL Editor → New query** → paste the whole of `supabase/schema.sql` → **Run**. This creates the tables, Row Level Security policies, the `images` storage bucket and its policies, and starter content.
3. **Authentication → Providers → Email**: keep Email enabled. **Authentication → Sign In / Providers (or Settings)**: turn **off "Allow new users to sign up"** so nobody else can register.
4. **Authentication → Users → Add user → Create new user**: enter your admin email and a strong password, tick "Auto Confirm User".
5. **SQL Editor** → run (use your admin email):
   `insert into public.admins (user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL';`
6. **Project Settings → API**: copy the **Project URL** and the **anon / publishable** key. Never use or share the `service_role` key.
7. Storage check: **Storage** should show a public bucket named `images` (created by the SQL).

## 2. Run locally
```
npm install
cp .env.example .env     # fill in the two values
npm run dev              # http://localhost:5173  and  /admin
npm run build            # production build into dist/
```

## 3. Environment variables
| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

These are public by design; security comes from Row Level Security and the `admins` table, not from hiding the keys.

## 4. GitHub
```
git init
git add .
git commit -m "AM Digital Agency website"
git branch -M main
git remote add origin https://github.com/YOUR_USER/am-digital-agency.git
git push -u origin main
```
`.env` and `node_modules` are git-ignored.

## 5. Netlify deployment
1. Netlify → **Add new site → Import an existing project → GitHub** → pick the repo.
2. Build settings (also set in `netlify.toml`): **Build command** `npm run build`, **Publish directory** `dist`.
3. **Site configuration → Environment variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Redirects for `/admin` come from `netlify.toml` and `public/_redirects`.
5. In Supabase → **Authentication → URL Configuration**, set Site URL to your Netlify address.

## 6. Using the admin panel
Open `/admin`, sign in, then manage Services, Portfolio (with image upload), Packages & prices, Website Text, About Us, Inquiries (contact form submissions) and Images.

## Security notes
- All writes require a signed-in user listed in `public.admins`, enforced by Row Level Security (`public.is_admin()`), including storage uploads.
- The public can only read content and insert inquiries (length-limited).
- No secret keys are in the code.
