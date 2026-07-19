// Single source of truth for admin accounts, shared by the client and the API.
//
// This lives in src/shared/ rather than api/_admins.ts on purpose: Vercel excludes
// underscore-prefixed files in api/ from the build entirely, so importing one
// compiles fine locally and then crashes every function at runtime with
// FUNCTION_INVOCATION_FAILED. Keep shared API code outside api/.
export const ADMIN_EMAILS = [
  'michcopski@gmail.com',
  'admin@saveboard.app',
  'artking81@hotmail.com',
];

/** Client-side gate — only hides the Admin menu. Real enforcement is server-side. */
export const isAdmin = (email?: string | null) => ADMIN_EMAILS.includes(email ?? '');

/** Returns the caller's email if their bearer token belongs to an admin, else null. */
export function adminEmailFromToken(authHeader: string | undefined): string | null {
  const token = (authHeader ?? '').replace('Bearer ', '');
  if (!token) return null;
  try {
    // base64url → base64, re-padded. atob exists in both Node 16+ and the browser,
    // so this file stays safe to import from either side.
    let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(b64));
    const email = payload.email ?? '';
    return ADMIN_EMAILS.includes(email) ? email : null;
  } catch {
    return null;
  }
}
