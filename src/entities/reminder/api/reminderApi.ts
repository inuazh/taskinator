import { Reminder } from "../model/types";

export async function getReminders(cardId: string): Promise<Reminder[]> {
  const res = await fetch(`/api/cards/${cardId}/reminders`);
  if (!res.ok) throw new Error("Ошибка загрузки напоминаний");
  return res.json();
}

export async function createReminder(
  cardId: string,
  text: string,
  remindAt: string
): Promise<Reminder> {
  const res = await fetch(`/api/cards/${cardId}/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, remindAt }),
  });
  if (!res.ok) throw new Error("Ошибка создания напоминания");
  return res.json();
}

export async function deleteReminder(
  cardId: string,
  reminderId: string
): Promise<void> {
  const res = await fetch(`/api/cards/${cardId}/reminders/${reminderId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Ошибка удаления напоминания");
}

export async function toggleReminderDone(
  cardId: string,
  reminderId: string,
  isDone: boolean
): Promise<Reminder> {
  const res = await fetch(`/api/cards/${cardId}/reminders/${reminderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDone }),
  });
  if (!res.ok) throw new Error("Ошибка обновления");
  return res.json();
}
