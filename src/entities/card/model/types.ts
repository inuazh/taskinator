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
  isDone: boolean;
  lastSentAt: string | null;
  createdAt: string;
}

// Card as returned by the list endpoint (kanban) — lightweight
export interface Card {
  id: string;
  userId: string;
  title: string;
  link: string | null;
  status: CardStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count: { notes: number; reminders: number };
  reminders: { remindAt: string }[]; // only nearest active task for preview
}

// Full card with all notes and reminders (card detail page)
export interface CardFull {
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
