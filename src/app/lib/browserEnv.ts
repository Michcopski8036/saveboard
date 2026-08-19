// In-app browsers (KakaoTalk, Line, Instagram, Facebook…) block Google OAuth
// ("disallowed_useragent") and don't persist the login session, so sign-in can
// never complete there. Detect them so share/invite pages can route the user
// to the app or the real system browser instead of a doomed sign-in redirect.
export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || '';
  return /KAKAOTALK|Line\/|NAVER|DaumApps|FBAN|FBAV|Instagram|Threads|Snapchat|musical_ly/i.test(ua);
}

// Break out of the in-app browser into the real system browser.
export function openExternalBrowser(url: string) {
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK/i.test(ua)) {
    window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  } else if (/Line\//i.test(ua)) {
    window.location.href = url + (url.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
  } else if (/Android/i.test(ua)) {
    window.location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  } else {
    alert('Open this page in Safari or Chrome to sign in:\nTap the ⋯ / share menu → "Open in browser".');
  }
}
