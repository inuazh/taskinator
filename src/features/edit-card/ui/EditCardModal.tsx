"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";
import { Card, CardStatus } from "@/entities/card/model/types";
import { updateCard, deleteCard } from "@/entities/card/api/cardApi";
import { getNotes, createNote, deleteNote } from "@/entities/note/api/noteApi";
import {
  getReminders,
  createReminder,
  deleteReminder,
} from "@/entities/reminder/api/reminderApi";
import { Note } from "@/entities/note/model/types";
import { Reminder } from "@/entities/reminder/model/types";
import { NoteItem } from "@/entities/note/ui/NoteItem";
import { ReminderItem } from "@/entities/reminder/ui/ReminderItem";
import toast from "react-hot-toast";

interface EditCardModalProps {
  cardId: string;
  cards: Card[];
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: "NEW", label: "Новая" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "DONE", label: "Завершена" },
  { value: "PROBLEM", label: "Проблема" },
];

export function EditCardModal({
  cardId,
  cards,
  onClose,
  onUpdated,
}: EditCardModalProps) {
  const card = cards.find((c) => c.id === cardId);

  const [title, setTitle] = useState(card?.title || "");
  const [link, setLink] = useState(card?.link || "");
  const [status, setStatus] = useState<CardStatus>(card?.status || "NEW");
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderText, setNewReminderText] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);

  const loadData = useCallback(async () => {
    if (!cardId) return;
    try {
      const [notesData, remindersData] = await Promise.all([
        getNotes(cardId),
        getReminders(cardId),
      ]);
      setNotes(notesData);
      setReminders(remindersData);
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
    }
  }, [cardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(cardId, {
        title,
        link: link || null,
        status,
      });
      toast.success("Карточка сохранена");
      onUpdated();
      onClose();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить карточку? Все заметки и напоминания будут удалены.")) {
      return;
    }
    try {
      await deleteCard(cardId);
      toast.success("Карточка удалена");
      onUpdated();
      onClose();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setAddingNote(true);
    try {
      const note = await createNote(cardId, newNoteText);
      setNotes((prev) => [note, ...prev]);
      setNewNoteText("");
      toast.success("Заметка добавлена");
    } catch {
      toast.error("Ошибка добавления заметки");
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(cardId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      toast.error("Ошибка удаления заметки");
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderText.trim() || !newReminderDate || !newReminderTime) return;
    setAddingReminder(true);
    try {
      const remindAt = new Date(
        `${newReminderDate}T${newReminderTime}`
      ).toISOString();
      const reminder = await createReminder(cardId, newReminderText, remindAt);
      setReminders((prev) => [...prev, reminder].sort(
        (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
      ));
      setNewReminderText("");
      setNewReminderDate("");
      setNewReminderTime("");
      toast.success("Напоминание добавлено");
    } catch {
      toast.error("Ошибка добавления напоминания");
    } finally {
      setAddingReminder(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(cardId, reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch {
      toast.error("Ошибка удаления напоминания");
    }
  };

  if (!card) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Редактирование карточки">
      <div className="space-y-6">
        {/* Основные поля */}
        <div className="space-y-3">
          <Input
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Ссылка"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://t.me/username"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CardStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Заметки */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Заметки</h3>
          <div className="space-y-2 mb-3">
            {notes.length === 0 ? (
              <p className="text-sm text-gray-400">Нет заметок</p>
            ) : (
              notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onDelete={handleDeleteNote}
                />
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Новая заметка..."
              className="flex-1"
            />
          </div>
          <Button
            size="sm"
            onClick={handleAddNote}
            loading={addingNote}
            disabled={!newNoteText.trim()}
            className="mt-2"
          >
            Добавить заметку
          </Button>
        </div>

        {/* Напоминания */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Напоминания
          </h3>
          <div className="space-y-2 mb-3">
            {reminders.length === 0 ? (
              <p className="text-sm text-gray-400">Нет напоминаний</p>
            ) : (
              reminders.map((reminder) => (
                <ReminderItem
                  key={reminder.id}
                  reminder={reminder}
                  onDelete={handleDeleteReminder}
                />
              ))
            )}
          </div>
          <div className="space-y-2">
            <Input
              value={newReminderText}
              onChange={(e) => setNewReminderText(e.target.value)}
              placeholder="Текст напоминания"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddReminder}
              loading={addingReminder}
              disabled={
                !newReminderText.trim() || !newReminderDate || !newReminderTime
              }
            >
              Добавить напоминание
            </Button>
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Удалить карточку
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
