export type CardStatus = "NEW" | "IN_PROGRESS" | "DONE" | "PROBLEM";

export interface Note {
  id: string;
  cardId: string;
  text: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  cardId: string;
  text: string;
  remindAt: string;
  isSent: boolean;
  createdAt: string;
}

export interface Card {
  id: string;
  userId: string;
  title: string;
  link: string | null;
  status: CardStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  reminders: Reminder[];
}

export interface CreateCardDto {
  title: string;
  link?: string;
  status?: CardStatus;
}

export interface UpdateCardDto {
  title?: string;
  link?: string | null;
  status?: CardStatus;
}
