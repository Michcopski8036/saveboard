// Creates a public SaveBoard board + links for a weekly /guides/ post, owned by
// the guides-bot system account. Bypasses the create_board/share_board RPCs
// (which require a real authenticated auth.uid()) by inserting directly via
// the service-role client, which bypasses RLS. Deliberately does not replicate
// the per-plan board/share-count limits from those RPCs — this is an internal
// system account, not a paying user, so those tier caps don't apply.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const GUIDES_BOT_USER_ID = process.env.GUIDES_BOT_USER_ID ?? 'b749a7b5-ccb6-432f-b475-2abc424d3ff5';
const SUPABASE_URL = 'https://mchikdltrcbovhdzdhhf.supabase.co';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/create-guide-board.mjs <input.json>');
  process.exit(1);
}
if (GUIDES_BOT_USER_ID === 'REPLACE_AFTER_STEP_1') {
  console.error('GUIDES_BOT_USER_ID is not set — run Task 2 Step 1 first, then export GUIDES_BOT_USER_ID.');
  process.exit(1);
}

const { boardName, items } = JSON.parse(await readFile(inputPath, 'utf8'));
if (!boardName || !Array.isArray(items) || !items.length) {
  console.error('Input JSON needs { boardName: string, items: Array<{title,url,description,image}> }');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: board, error: boardError } = await supabase
  .from('boards')
  .insert({ owner_id: GUIDES_BOT_USER_ID, name: boardName, sort_order: 0 })
  .select()
  .single();
if (boardError) { console.error('board insert failed:', boardError.message); process.exit(1); }

const { error: memberError } = await supabase
  .from('board_members')
  .insert({ board_id: board.id, user_id: GUIDES_BOT_USER_ID, role: 'owner' });
if (memberError) { console.error('board_members insert failed:', memberError.message); process.exit(1); }

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
const snapshot = linkRows.map(row => ({
  id: row.id,
  url: row.url,
  title: row.title,
  description: row.description,
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
    links_snapshot: snapshot,
    synced_at: new Date().toISOString(),
    owner_name: 'SaveBoard Guides',
    owner_email: 'guides-bot@saveboard.app',
  })
  .select('token')
  .single();
if (sharedError) { console.error('shared_boards insert failed:', sharedError.message); process.exit(1); }

console.log(JSON.stringify({
  boardId: board.id,
  shareUrl: `https://www.saveboard.app/share/${shared.token}`,
}));
