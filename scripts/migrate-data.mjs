// One-time copy of all data from the old (Lovable Cloud) Supabase project to a new one.
//
// Reads the old project as the site admin (RLS lets admins see pending projects, submitter
// emails, contact messages and settings), writes the new project with its service-role key,
// and re-hosts uploaded images in the new project's `project-images` bucket.
//
// Usage (the new project must already have the migrations applied):
//   OLD_SUPABASE_URL=... OLD_SUPABASE_ANON_KEY=... OLD_ADMIN_EMAIL=... OLD_ADMIN_PASSWORD=... \
//   NEW_SUPABASE_URL=... NEW_SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/migrate-data.mjs [--dry-run]
//
// Safe to re-run: rows are upserted by primary key and images are overwritten in place.

import { createClient } from '@supabase/supabase-js';

const env = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
};

const dryRun = process.argv.includes('--dry-run');
const oldUrl = env('OLD_SUPABASE_URL').replace(/\/$/, '');
const newUrl = env('NEW_SUPABASE_URL').replace(/\/$/, '');
const BUCKET = 'project-images';
const oldPublicPrefix = `${oldUrl}/storage/v1/object/public/${BUCKET}/`;

const oldDb = createClient(oldUrl, env('OLD_SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
const newDb = createClient(newUrl, env('NEW_SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

const { error: signInError } = await oldDb.auth.signInWithPassword({
  email: env('OLD_ADMIN_EMAIL'),
  password: env('OLD_ADMIN_PASSWORD'),
});
if (signInError) {
  console.error('Could not sign in to the old project as admin:', signInError.message);
  process.exit(1);
}

// PostgREST caps responses at 1000 rows, so page through each table.
const readAll = async (table) => {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await oldDb.from(table).select('*').range(from, from + 999);
    if (error) throw new Error(`Reading ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
};

const write = async (table, rows, onConflict) => {
  if (dryRun || rows.length === 0) return;
  const { error } = await newDb.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`Writing ${table}: ${error.message}`);
};

const projects = await readAll('projects');
const submissions = await readAll('project_submissions');
const contacts = await readAll('contact_submissions');
const settings = await readAll('app_settings');

const statusCounts = projects.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }), {});
console.log(`projects: ${projects.length} ${JSON.stringify(statusCounts)}`);
console.log(`project_submissions: ${submissions.length}`);
console.log(`contact_submissions: ${contacts.length}`);
console.log(`app_settings: ${settings.length}`);

if (!statusCounts.pending && !statusCounts.rejected) {
  console.warn('Warning: no pending or rejected projects were visible. Is this account an admin on the old site?');
}

// Copy images that live in the old project's storage and point the rows at the new copies.
// Other image URLs (external links, bundled assets) are left as they are.
let copied = 0;
for (const project of projects) {
  if (!project.image_url?.startsWith(oldPublicPrefix)) continue;
  const path = decodeURIComponent(project.image_url.slice(oldPublicPrefix.length));

  const response = await fetch(project.image_url);
  if (!response.ok) {
    console.warn(`  ! ${project.name}: image download failed (${response.status}), keeping old URL`);
    continue;
  }

  if (!dryRun) {
    const { error } = await newDb.storage.from(BUCKET).upload(path, await response.arrayBuffer(), {
      contentType: response.headers.get('content-type') ?? undefined,
      upsert: true,
    });
    if (error) {
      console.warn(`  ! ${project.name}: image upload failed (${error.message}), keeping old URL`);
      continue;
    }
  }

  project.image_url = newDb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  copied++;
}
console.log(`images copied: ${copied}`);

await write('projects', projects, 'id');
await write('project_submissions', submissions, 'id');
await write('contact_submissions', contacts, 'id');
await write('app_settings', settings, 'key');

console.log(dryRun ? 'Dry run: nothing was written.' : 'Done.');
