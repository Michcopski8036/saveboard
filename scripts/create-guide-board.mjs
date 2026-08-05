// Creates a public SaveBoard board + links for a weekly /guides/ post, owned by
// the guides-bot account.
//
// This signs in as that account with the publishable (anon) key and goes
// through the same RLS-guarded path the app uses — create_board, then links,
// then a shared_boards row. It deliberately does NOT use the service-role key:
// that key bypasses RLS on every table, so handing it to a scheduled routine
// would trade "publish one board a week" for full read/write on every user's
// links and subscriptions.
//
// The per-plan board and share caps still apply; guides-bot is exempted from
// them by public.system_accounts (see 20260805_system_accounts.sql) rather than
// by a fake subscription, which would show up in admin-stats as a paying
// customer.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mchikdltrcbovhdzdhhf.supabase.co';
const ANON_KEY = 'sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/create-guide-board.mjs <input.json>');
  process.exit(1);
}

const { GUIDES_BOT_EMAIL, GUIDES_BOT_PASSWORD } = process.env;
if (!GUIDES_BOT_EMAIL || !GUIDES_BOT_PASSWORD) {
  console.error('GUIDES_BOT_EMAIL and GUIDES_BOT_PASSWORD must be set.');
  console.error('Not set for this routine yet? Do NOT publish with an empty board_url —');
  console.error('finish the post, leave it empty, and report the board as the outstanding item.');
  process.exit(1);
}

const { boardName, boardNameKo, items } = JSON.parse(await readFile(inputPath, 'utf8'));
if (!boardName || !Array.isArray(items) || !items.length) {
  console.error('Input JSON needs { boardName, boardNameKo, items: Array<{title,titleKo,url,description,descriptionKo,image}> }');
  process.exit(1);
}

// One board serves both the English and the Korean version of a guide post, so
// it carries both languages and the share page picks by the reader's app
// language. Missing Korean isn't fatal — the page falls back to English — but
// it means Korean readers get an English board, so say so loudly.
const missingKo = items.filter(i => !i.titleKo || !i.descriptionKo).map(i => i.title);
if (!boardNameKo || missingKo.length) {
  console.warn('⚠️  Korean copy missing — Korean readers will see English.');
  if (!boardNameKo) console.warn('    boardNameKo is not set');
  if (missingKo.length) console.warn(`    ${missingKo.length} item(s): ${missingKo.join(', ')}`);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: session, error: authError } = await supabase.auth.signInWithPassword({
  email: GUIDES_BOT_EMAIL,
  password: GUIDES_BOT_PASSWORD,
});
if (authError) { console.error('guides-bot sign-in failed:', authError.message); process.exit(1); }
const GUIDES_BOT_USER_ID = session.user.id;

// create_board also adds the owner to board_members and enforces the per-plan
// board cap, which system_accounts exempts guides-bot from.
const { data: board, error: boardError } = await supabase.rpc('create_board', { p_name: boardName });
if (boardError) { console.error('create_board failed:', boardError.message); process.exit(1); }

const linkRows = items.map(item => ({
  id: randomUUID(),
  user_id: GUIDES_BOT_USER_ID,
  board_id: board.id,
  url: item.url,
  title: item.title,
  description: item.description ?? '',
  image: item.image ?? '',
  created_at: Date.now(),
}));
const { error: linksError } = await supabase.from('links').insert(linkRows);
if (linksError) { console.error('links insert failed:', linksError.message); process.exit(1); }

// The public read-only page (/share/<token>) reads shared_boards via the anon
// get_shared_board RPC — it is NOT boards.invite_token, which is the
// login-required collaborator join link (/join/<token>). A guide board needs a
// shared_boards row carrying its own snapshot of the links, same as what
// BoardShareModal's pushSnapshot writes for a human user.
const snapshot = linkRows.map((row, i) => ({
  id: row.id,
  url: row.url,
  title: row.title,
  title_ko: items[i].titleKo ?? null,
  description: row.description,
  description_ko: items[i].descriptionKo ?? null,
  image: row.image,
  category: boardName,
  notes: null,
  saved_at: new Date(row.created_at).toISOString(),
}));
const { data: shared, error: sharedError } = await supabase
  .from('shared_boards')
  .insert({
    owner_id: GUIDES_BOT_USER_ID,
    category: boardName,
    category_ko: boardNameKo ?? null,
    links_snapshot: snapshot,
    synced_at: new Date().toISOString(),
    owner_name: 'SaveBoard Guides',
    owner_email: 'guides-bot@saveboard.app',
  })
  .select('token')
  .single();
if (sharedError) { console.error('shared_boards insert failed:', sharedError.message); process.exit(1); }

await supabase.auth.signOut();

console.log(JSON.stringify({
  boardId: board.id,
  shareUrl: `https://www.saveboard.app/share/${shared.token}`,
}));
