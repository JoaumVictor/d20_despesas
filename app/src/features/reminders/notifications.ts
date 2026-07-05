import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import type { MonthReminder } from './api';

const CHANNEL_ID = 'reminders';
const ID_PREFIX = 'reminder-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Dias antes do vencimento em que avisamos (3, 2 e 1 dia antes). */
const OFFSETS = [3, 2, 1];

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembretes',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Pede permissão de notificação (idempotente — não repergunta se já decidido). */
export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Resincroniza os lembretes locais de vencimento: cancela tudo que já estava
 * agendado (prefixo `reminder-`) e reagenda do zero com base no estado atual
 * — simples e sem risco de duplicar ou deixar lembrete excluído/pago para trás.
 */
export async function syncReminderNotifications(reminders: MonthReminder[]): Promise<void> {
  const granted = await Notifications.getPermissionsAsync();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  if (!granted.granted) return;

  const now = new Date();
  const mk = monthKeyOf(now);

  for (const reminder of reminders) {
    if (reminder.completion) continue; // já pago/concluído este mês

    for (const offset of OFFSETS) {
      const date = new Date(now.getFullYear(), now.getMonth(), reminder.due_day - offset, 9, 0, 0);
      if (date.getTime() <= now.getTime()) continue; // data já passou

      const dayLabel = offset === 1 ? 'amanhã' : `em ${offset} dias`;
      await Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${reminder.id}-${mk}-d${offset}`,
        content: {
          title: `${reminder.description} vence ${dayLabel}`,
          body: `Dia ${reminder.due_day} · não esquece hein 👀`,
          data: { reminderId: reminder.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

/** Pede permissão (uma vez) e mantém as notificações locais de vencimento em dia. */
export function useSyncReminderNotifications(reminders: MonthReminder[] | undefined) {
  useEffect(() => {
    if (!reminders) return;
    let cancelled = false;
    (async () => {
      await ensureNotificationPermission();
      if (!cancelled) await syncReminderNotifications(reminders);
    })();
    return () => {
      cancelled = true;
    };
  }, [reminders]);
}
