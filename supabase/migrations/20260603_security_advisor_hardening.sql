-- Follow-up hardening for Supabase security-advisor findings (2026-06-03),
-- applied to pre-existing objects (not created by the RLS migrations).

-- ── 1. storage.pdfs: stop anonymous enumeration of the bucket ────────────────
-- The bucket is public (files are served by exact URL via getPublicUrl, which
-- is required for card thumbnails and shared-board images). A blanket
-- "Allow public read" SELECT policy for the public role also allowed anon to
-- LIST the bucket and walk every {user_id}/{filename} path, then download all
-- files. Public *downloads by exact path* still work (the public object
-- endpoint bypasses RLS); only listing is removed. The app's only legitimate
-- list() is an authenticated user listing their own folder (App.tsx), and
-- delete-account uses the service role (bypasses RLS).
drop policy "Allow public read" on storage.objects;

create policy "Allow owner read pdfs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pdfs'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- ── 2. handle_new_user: pin search_path + remove direct execute ──────────────
-- SECURITY DEFINER signup trigger. It only references public.profiles (already
-- schema-qualified) and the trigger NEW record, so an empty search_path is safe
-- and is the most hardened setting (prevents search_path hijacking). Triggers
-- fire regardless of EXECUTE grants, so revoking direct execute does not affect
-- signups — it just stops clients from calling the function directly.
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
