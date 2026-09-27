# madewithdescript.com

A community directory of projects made with Descript. Visitors browse and submit projects; an admin
approves them at `/admin`.

- **Frontend:** React + Vite + Tailwind (shadcn/ui), deployed as Cloudflare Workers static assets.
  `worker.js` only redirects `www` to the bare domain; every other request is served from `dist/`
  (unknown paths fall back to `index.html` so `/admin` and `/auth` work).
- **Backend:** Supabase: Postgres (`projects`, `project_submissions`, `contact_submissions`,
  `app_settings`, `user_roles`), the `project-images` storage bucket, email/password auth for the
  admin, and edge functions in `supabase/functions/`.

```sh
npm install
npm run dev        # http://localhost:8080
npm run build      # → dist/
npm run deploy     # build + wrangler deploy
```

The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env` at build time.
Both are public values (the anon key is protected by row-level security), so `.env` is committed.

## Edge functions

| Function | Called when | Secrets |
| --- | --- | --- |
| `notify-submission` | A project is submitted; emails the admin | `RESEND_API_KEY`, `ADMIN_EMAIL` |
| `forward-submission-webhook` | A project is submitted; POSTs to the webhook URL set in Admin → Settings | none |
| `send-contact` | Not currently called by the site | `RESEND_API_KEY`, `ADMIN_EMAIL` |

Emails are sent from `onboarding@resend.dev`, which Resend only delivers to the Resend account's own
address. To send from your own domain, verify it in Resend and change the `from` field.

## Moving off Lovable

The site used to be hosted by Lovable, with its database in a Lovable-managed Supabase project.
To finish moving:

### 1. Create the new Supabase project

1. Create a project at [supabase.com](https://supabase.com) (the free tier is enough).
2. Apply the schema, deploy the functions and set their secrets:

   ```sh
   npx supabase login
   npx supabase link --project-ref <new-project-ref>
   npx supabase db push                                # runs supabase/migrations/
   npx supabase functions deploy notify-submission --no-verify-jwt
   npx supabase functions deploy forward-submission-webhook --no-verify-jwt
   npx supabase functions deploy send-contact --no-verify-jwt
   npx supabase secrets set RESEND_API_KEY=... ADMIN_EMAIL=...
   ```

3. In **Authentication → URL Configuration**, set the Site URL to `https://madewithdescript.com`.

### 2. Copy the data

`scripts/migrate-data.mjs` signs in to the old project as the admin and copies every project
(pending and rejected included), submitter emails, contact messages and settings, plus the uploaded
images. It's safe to re-run. Try it with `--dry-run` first:

```sh
OLD_SUPABASE_URL=<current VITE_SUPABASE_URL> \
OLD_SUPABASE_ANON_KEY=<current VITE_SUPABASE_PUBLISHABLE_KEY> \
OLD_ADMIN_EMAIL=... OLD_ADMIN_PASSWORD=... \
NEW_SUPABASE_URL=https://<new-project-ref>.supabase.co \
NEW_SUPABASE_SERVICE_ROLE_KEY=... \
npm run migrate-data -- --dry-run
```

Run it once more without `--dry-run` just before switching DNS so late submissions come across too.

### 3. Point the site at the new project and recreate the admin

1. Put the new project's URL and anon key in `.env`, then commit.
2. Deploy, open the site, and sign up at `/auth` with the admin email.
3. Make that account an admin in the Supabase SQL editor:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'you@example.com';
   ```

### 4. Deploy to Cloudflare

Either run `npm run deploy` locally (after `npx wrangler login`), or in the Cloudflare dashboard go to
**Workers & Pages → Create → Import a repository**, pick this repo, and use build command
`npm run build` and deploy command `npx wrangler deploy`, so every push to `main` deploys.
The site is first live on its `*.workers.dev` URL; check it there.

### 5. Move the domain

1. In Cloudflare DNS for `madewithdescript.com`, delete the A records that point at Lovable
   (for the apex and `www`).
2. Uncomment the `routes` block in `wrangler.jsonc` and deploy again. Cloudflare creates the DNS
   records and certificates for both hostnames.
3. Disconnect the domain in Lovable's project settings.
