// Single source of truth for admin accounts (server side).
// Mirrored in src/app/lib/admins.ts for the client-side menu gate.
export const ADMIN_EMAILS = new Set([
  'michcopski@gmail.com',
  'admin@saveboard.app',
  'artking81@hotmail.com',
]);

/** Returns the caller's email if their bearer token belongs to an admin, else null. */
export function adminEmailFromToken(authHeader: string | undefined): string | null {
  const token = (authHeader ?? '').replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const email = payload.email ?? '';
    return ADMIN_EMAILS.has(email) ? email : null;
  } catch {
    return null;
  }
}
