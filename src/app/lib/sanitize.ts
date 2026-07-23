import DOMPurify from 'dompurify';

// Sanitises rich-text/HTML before it hits dangerouslySetInnerHTML.
//
// Card descriptions come from two places: the user's own rich-text memos
// (trusted) AND og:description scraped from arbitrary external pages by
// api/metadata.ts (UNTRUSTED — a malicious page can set
// `<meta property="og:description" content="<img src=x onerror=...>">`).
// The old `desc.startsWith('<')` gate rendered that raw, so a saved link could
// inject script into the app and into public shared boards. Route every HTML
// render through DOMPurify's standard HTML profile, which strips <script>,
// event-handler attributes (onerror/onload/…) and javascript: URLs while
// keeping the formatting tags tiptap emits.
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
