// Set a project's image and description from its YouTube channel.
//
// Looks the project up by name, reads its URL (a channel, or a video on the channel), and copies
// the channel's profile picture into the `project-images` bucket and its description into the
// project. Signs in as the site admin, so it only needs the public values in .env.
//
// Usage:
//   node scripts/refresh-from-youtube.mjs "Trustee Roadmap" --dry-run
//   node scripts/refresh-from-youtube.mjs "Trustee Roadmap" [--description "Custom text"] [--url https://youtube.com/@Handle]

import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';

process.loadEnvFile('.env');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};
const dryRun = args.includes('--dry-run') && args.splice(args.indexOf('--dry-run'), 1);
const descriptionOverride = flag('--description');
const urlOverride = flag('--url');
const search = args[0];
if (!search) {
  console.error('Usage: node scripts/refresh-from-youtube.mjs "<project name>" [--dry-run]');
  process.exit(1);
}

const ask = async (question, { hidden = false } = {}) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  if (hidden) rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? s : '');
  const answer = await rl.question(question);
  rl.close();
  if (hidden) process.stdout.write('\n');
  return answer.trim();
};

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const meta = (html, property) => {
  const match = html.match(new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)"`));
  return match ? decode(match[1]) : undefined;
};

const fetchPage = async (url) => {
  const response = await fetch(url, { headers: { 'Accept-Language': 'en-US,en', Cookie: 'CONSENT=YES+1' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
};

// First paragraph, trimmed to whole sentences within ~220 characters.
const shorten = (text) => {
  const paragraph = text.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  if (paragraph.length <= 220) return paragraph;
  const sentences = paragraph.match(/[^.!?]+[.!?]+/g) ?? [paragraph];
  let out = '';
  for (const sentence of sentences) {
    if ((out + sentence).length > 220) break;
    out += sentence;
  }
  return (out || paragraph.slice(0, 217) + '...').trim();
};

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

const email = process.env.ADMIN_EMAIL || (await ask('Admin email: '));
const password = await ask('Admin password: ', { hidden: true });
const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
if (signInError) {
  console.error('Sign-in failed:', signInError.message);
  process.exit(1);
}

const { data: matches, error: findError } = await supabase
  .from('projects')
  .select('id, name, url, description, image_url, status')
  .ilike('name', `%${search}%`);
if (findError) throw findError;
if (matches.length !== 1) {
  console.error(`Expected one project matching "${search}", found ${matches.length}:`);
  for (const p of matches) console.error(`  - ${p.name}`);
  process.exit(1);
}
const project = matches[0];

let pageUrl = urlOverride || project.url;
let html = await fetchPage(pageUrl);

// A video page: follow it to the channel that posted it.
if (meta(html, 'og:type')?.startsWith('video')) {
  const handle = html.match(/"canonicalBaseUrl":"(\/@[^"]+)"/)?.[1];
  if (!handle) throw new Error(`Couldn't find the channel for ${pageUrl}; pass --url https://youtube.com/@Handle`);
  pageUrl = `https://www.youtube.com${handle}`;
  html = await fetchPage(pageUrl);
}

const avatarUrl = meta(html, 'og:image')?.replace(/=s\d+/, '=s800');
const channelName = meta(html, 'og:title');
const description = descriptionOverride ?? shorten(meta(html, 'og:description') ?? '');
if (!avatarUrl) throw new Error(`No channel image found at ${pageUrl}`);

console.log(`Project:     ${project.name} (${project.status})`);
console.log(`Channel:     ${channelName} — ${pageUrl}`);
console.log(`Image:       ${avatarUrl}`);
console.log(`Description: ${project.description}`);
console.log(`          →  ${description || '(unchanged: channel has no description)'}`);

if (dryRun) {
  console.log('Dry run: nothing was changed.');
  process.exit(0);
}

const image = await fetch(avatarUrl);
if (!image.ok) throw new Error(`Downloading the channel image failed: HTTP ${image.status}`);
const contentType = image.headers.get('content-type') ?? 'image/jpeg';
const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
const path = `youtube-${project.id}-${Date.now()}.${extension}`;

const { error: uploadError } = await supabase.storage
  .from('project-images')
  .upload(path, await image.arrayBuffer(), { contentType });
if (uploadError) throw uploadError;

const updates = { image_url: supabase.storage.from('project-images').getPublicUrl(path).data.publicUrl };
if (description) updates.description = description;

// RLS silently skips rows the user can't edit, so check that the row really changed.
const { data: updated, error: updateError } = await supabase
  .from('projects')
  .update(updates)
  .eq('id', project.id)
  .select('id');
if (updateError) throw updateError;
if (updated.length !== 1) throw new Error('The project was not updated. Is this account an admin?');

console.log('Updated.');
