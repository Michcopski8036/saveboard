// Client-side admin gate — hides the Admin menu entry for non-admins.
// The real enforcement lives in api/_admins.ts (server side); keep both in sync.
export const ADMIN_EMAILS = [
  'michcopski@gmail.com',
  'admin@saveboard.app',
  'artking81@hotmail.com',
];

export const isAdmin = (email?: string | null) => ADMIN_EMAILS.includes(email ?? '');
