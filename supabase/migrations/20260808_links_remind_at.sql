-- Reminders (Pro): optional wake-up time on a saved link. Cleared = null.
-- Apply BEFORE deploying the client that reads/writes it.
alter table links add column if not exists remind_at timestamptz;
