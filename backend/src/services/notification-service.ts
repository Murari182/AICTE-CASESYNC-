import { AlertRecord } from '../../../src/types/casesync';

/**
 * Notification & Alert Lifecycle Service
 * Separates notification read/unread state from operational alert acknowledgement and resolution.
 */
export function markNotificationReadState(
  alerts: AlertRecord[],
  alertId: string,
  isRead: boolean
): AlertRecord[] {
  return alerts.map((a) =>
    a.alert_id === alertId ? { ...a, is_read: isRead } : a
  );
}

export function markAllNotificationsRead(alerts: AlertRecord[]): AlertRecord[] {
  return alerts.map((a) => ({ ...a, is_read: true }));
}

export function computeUnreadNotificationsCount(alerts: AlertRecord[]): number {
  return alerts.filter((a) => !a.is_read && a.resolution_status !== 'Dismissed')
    .length;
}
