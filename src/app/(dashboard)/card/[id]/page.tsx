"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import toast from "react-hot-toast";

const STATUS_OPTIONS: { value: CardStatus; label: string; color: string }[] = [
  { value: "NEW", label: "Новая", color: "bg-blue-100 text-blue-800" },
  { value: "IN_PROGRESS", label: "В работе", color: "bg-yellow-100 text-yellow-800" },
  { value: "DONE", label: "Завершена", color: "bg-green-100 text-green-800" },
  { value: "PROBLEM", label: "Проблема", color: "bg-red-100 text-red-800" },
];

type ChatMessage =
  | { type: "note"; data: Note }
  | { type: "reminder"; data: Reminder };

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CardPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<CardStatus>("NEW");
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingLink, setEditingLink] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [messageText, setMessageText] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);

  const loadCard = useCallback(async () => {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) throw new Error();
      const data: Card = await res.json();
      setCard(data);
      setTitle(data.title);
      setLink(data.link || "");
      setStatus(data.status);
    } catch {
      toast.error("Карточка не найдена");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [cardId, router]);

  const loadData = useCallback(async () => {
    try {
      const [notesData, remindersData] = await Promise.all([
        getNotes(cardId),
        getReminders(cardId),
      ]);
      setNotes(notesData);
      setReminders(remindersData);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
    }
  }, [cardId]);

  useEffect(() => {
    loadCard();
    loadData();
  }, [loadCard, loadData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes, reminders]);

  // Merge notes and reminders into a timeline
  const messages: ChatMessage[] = [
    ...notes.map((n) => ({ type: "note" as const, data: n })),
    ...reminders.map((r) => ({ type: "reminder" as const, data: r })),
  ].sort(
    (a, b) =>
      new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
  );

  const handleSendNote = async () => {
    if (!messageText.trim()) return;
    setSendingNote(true);
    try {
      const note = await createNote(cardId, messageText);
      setNotes((prev) => [...prev, note]);
      setMessageText("");
    } catch {
      toast.error("Ошибка отправки");
    } finally {
      setSendingNote(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendNote();
    }
  };

  const handleAddReminder = async () => {
    if (!reminderText.trim() || !reminderDate || !reminderTime) return;
    setSendingReminder(true);
    try {
      const remindAt = new Date(`${reminderDate}T${reminderTime}`).toISOString();
      const reminder = await createReminder(cardId, reminderText, remindAt);
      setReminders((prev) => [...prev, reminder]);
      setReminderText("");
      setReminderDate("");
      setReminderTime("");
      setShowReminderForm(false);
      toast.success("Напоминание добавлено");
    } catch {
      toast.error("Ошибка");
    } finally {
      setSendingReminder(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(cardId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(cardId, reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleSaveField = async (field: "title" | "link" | "status", value: string) => {
    setSaving(true);
    try {
      await updateCard(cardId, { [field]: field === "link" ? value || null : value });
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
      setEditingTitle(false);
      setEditingLink(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить карточку? Все заметки и напоминания будут удалены.")) return;
    try {
      await deleteCard(cardId);
      toast.success("Карточка удалена");
      router.push("/");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!card) return null;

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left sidebar - card info */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 p-5 flex flex-col overflow-y-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к доске
        </button>

        {/* Title */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Название</label>
          {editingTitle ? (
            <div className="mt-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveField("title", title)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveField("title", title)}
                autoFocus
              />
            </div>
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 mt-1 cursor-pointer hover:text-blue-600 transition"
              onClick={() => setEditingTitle(true)}
            >
              {title}
            </h2>
          )}
        </div>

        {/* Link */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Ссылка</label>
          {editingLink ? (
            <div className="mt-1">
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={() => handleSaveField("link", link)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveField("link", link)}
                placeholder="https://t.me/username"
                autoFocus
              />
            </div>
          ) : (
            <div className="mt-1">
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {link}
                </a>
              ) : (
                <span
                  className="text-sm text-gray-400 cursor-pointer hover:text-blue-500 transition"
                  onClick={() => setEditingLink(true)}
                >
                  Добавить ссылку...
                </span>
              )}
              {link && (
                <button
                  onClick={() => setEditingLink(true)}
                  className="block text-xs text-gray-400 hover:text-gray-600 mt-1"
                >
                  изменить
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Статус</label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatus(opt.value);
                  handleSaveField("status", opt.value);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  status === opt.value
                    ? opt.color + " ring-2 ring-offset-1 ring-current"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Заметок</span>
            <span className="font-medium">{notes.length}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Напоминаний</span>
            <span className="font-medium">{reminders.length}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Создана</span>
            <span className="font-medium">{formatDate(card.createdAt)}</span>
          </div>
        </div>

        {/* Delete */}
        <div className="mt-auto pt-4">
          <Button variant="danger" size="sm" onClick={handleDelete} className="w-full">
            Удалить карточку
          </Button>
        </div>
      </div>

      {/* Right side - chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Начните писать заметки...</p>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.type === "note") {
              const note = msg.data;
              return (
                <div key={`note-${note.id}`} className="flex justify-end group">
                  <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm">
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                    <div className="flex items-center justify-between mt-1 gap-3">
                      <span className="text-xs text-blue-200">
                        {formatDate(note.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs text-blue-200 hover:text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        удалить
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              const reminder = msg.data;
              const isPast = new Date(reminder.remindAt) < new Date();
              return (
                <div key={`rem-${reminder.id}`} className="flex justify-center group">
                  <div className={`max-w-[70%] rounded-xl px-4 py-2.5 shadow-sm border ${
                    reminder.isSent
                      ? "bg-green-50 border-green-200"
                      : isPast
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-500">Напоминание</span>
                    </div>
                    <p className="text-sm text-gray-800">{reminder.text}</p>
                    <div className="flex items-center justify-between mt-1 gap-3">
                      <span className={`text-xs ${
                        reminder.isSent ? "text-green-600" : isPast ? "text-red-500" : "text-yellow-600"
                      }`}>
                        {formatDate(reminder.remindAt)}
                        {reminder.isSent && " — Отправлено"}
                      </span>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="text-xs text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                        удалить
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Reminder form */}
        {showReminderForm && (
          <div className="px-5 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Новое напоминание</span>
              <button
                onClick={() => setShowReminderForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="Текст напоминания"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                size="sm"
                onClick={handleAddReminder}
                loading={sendingReminder}
                disabled={!reminderText.trim() || !reminderDate || !reminderTime}
              >
                Добавить
              </Button>
            </div>
          </div>
        )}

        {/* Chat input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              className={`p-2.5 rounded-lg transition flex-shrink-0 ${
                showReminderForm
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              title="Добавить напоминание"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать заметку..."
              rows={1}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: "42px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "42px";
                target.style.height = target.scrollHeight + "px";
              }}
            />
            <Button
              onClick={handleSendNote}
              loading={sendingNote}
              disabled={!messageText.trim()}
              className="flex-shrink-0 !rounded-xl !px-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
