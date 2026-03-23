import { Card, CreateCardDto, UpdateCardDto, CardStatus } from "../model/types";

export async function getCards(): Promise<Card[]> {
  const res = await fetch("/api/cards");
  if (!res.ok) throw new Error("Ошибка загрузки карточек");
  return res.json();
}

export async function createCard(data: CreateCardDto): Promise<Card> {
  const res = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Ошибка создания карточки");
  return res.json();
}

export async function updateCard(
  id: string,
  data: UpdateCardDto
): Promise<Card> {
  const res = await fetch(`/api/cards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Ошибка обновления карточки");
  return res.json();
}

export async function deleteCard(id: string): Promise<void> {
  const res = await fetch(`/api/cards/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Ошибка удаления карточки");
}

export async function reorderCards(
  cards: Array<{ id: string; status: CardStatus; order: number }>
): Promise<void> {
  const res = await fetch("/api/cards/reorder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards }),
  });
  if (!res.ok) throw new Error("Ошибка сортировки карточек");
}
