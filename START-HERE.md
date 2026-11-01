# AM Digital Agency – Complete Package

## Folder 1: 1-Netlify-Supabase-Website (the full, real website)
React + Vite + Supabase + Netlify. Public site at `/`, admin panel at `/admin` (email + password).

Includes: services, portfolio (photos AND videos), artwork gallery, experience timeline, skills, stats counters, client reviews, FAQ, packages and pricing, About Us, website text, custom sections you create yourself, customer inquiries from the contact form, image/video library, and logout. Black / dark-blue / white glass design with 3D globe, typing text, aurora background, spotlight cards, marquee, count-up numbers and scroll progress.

Follow `1-Netlify-Supabase-Website/README.md`. Summary:
1. Supabase: new project -> SQL Editor -> run `supabase/schema.sql` (fresh) or `supabase/update-v2.sql` (upgrading).
2. Authentication: turn OFF public sign-ups, add your admin user, then run:
   `insert into public.admins (user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL';`
3. Copy Project URL + anon key from Project Settings -> API (never the service_role key).
4. GitHub: `git init && git add . && git commit -m "AM Digital Agency" && git branch -M main && git remote add origin <your repo> && git push -u origin main`
5. Netlify: import the repo. Build command `npm run build`, publish directory `dist`.
   Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Open `https://YOUR-SITE.netlify.app/admin`.
Optional: `supabase/sample-data.sql` adds placeholder content so you can see every section; replace it in /admin.

## Folder 2: 2-Single-Page-Version (quick version, one file)
`index.html` is the same design as one file, with a built-in admin that works ONLY on the Claude-hosted page (it uses your Claude sign-in and publishes through Claude). On Netlify or other hosting it shows the site, but the Admin login cannot save. Use Folder 1 for a real admin on Netlify.

## Notes
- Before relying on it, run `npm install && npm run build` once; if it prints an error, send it to Claude to fix.
- Never put the Supabase service_role key in the site or in GitHub.
