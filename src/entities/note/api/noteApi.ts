import { Note } from "../model/types";

export async function getNotes(cardId: string): Promise<Note[]> {
  const res = await fetch(`/api/cards/${cardId}/notes`);
  if (!res.ok) throw new Error("Ошибка загрузки заметок");
  return res.json();
}

export async function createNote(
  cardId: string,
  text: string
): Promise<Note> {
  const res = await fetch(`/api/cards/${cardId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Ошибка создания заметки");
  return res.json();
}

export async function deleteNote(
  cardId: string,
  noteId: string
): Promise<void> {
  const res = await fetch(`/api/cards/${cardId}/notes/${noteId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Ошибка удаления заметки");
}
