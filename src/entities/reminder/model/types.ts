export interface Reminder {
  id: string;
  cardId: string;
  text: string;
  remindAt: string;
  isSent: boolean;
  isDone: boolean;
  lastSentAt: string | null;
  createdAt: string;
}
