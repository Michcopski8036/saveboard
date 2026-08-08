import { Capacitor } from '@capacitor/core';

// Stable numeric id for a link's notification (LocalNotifications wants ints).
function notifId(linkId: string): number {
  let h = 0;
  for (let i = 0; i < linkId.length; i++) h = (h * 31 + linkId.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/**
 * Schedule (or clear, when `when` is null) a native local notification for a
 * link reminder. Web is a no-op — the in-app due banner covers it there.
 * Wrapped in try/catch: store binaries built before the plugin was added
 * simply skip the native notification and keep the in-app reminder.
 */
export async function scheduleLocalReminder(linkId: string, title: string, when: Date | null): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const id = notifId(linkId);
    await LocalNotifications.cancel({ notifications: [{ id }] });
    if (!when || when.getTime() <= Date.now()) return;
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.schedule({
      notifications: [{ id, title: 'SaveBoard reminder', body: title, schedule: { at: when } }],
    });
  } catch { /* plugin not present in this binary — in-app banner still works */ }
}
