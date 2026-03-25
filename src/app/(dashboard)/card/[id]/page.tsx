"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { CardFull, CardStatus } from "@/entities/card/model/types";
import { updateCard, deleteCard } from "@/entities/card/api/cardApi";
import { createNote, deleteNote } from "@/entities/note/api/noteApi";
import {
  createReminder,
  deleteReminder,
  toggleReminderDone,
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

type TimelineItem =
  | { type: "note"; data: Note }
  | { type: "task"; data: Reminder };

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
  const feedEndRef = useRef<HTMLDivElement>(null);

  const [card, setCard] = useState<CardFull | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<CardStatus>("NEW");
  const [, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingLink, setEditingLink] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [messageText, setMessageText] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  // Task (дело) form — inline single input
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [taskDatetime, setTaskDatetime] = useState("");
  const [sendingTask, setSendingTask] = useState(false);

  // Single fetch — card includes notes + reminders
  const loadAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) throw new Error();
      const data: CardFull = await res.json();
      setCard(data);
      setTitle(data.title);
      setLink(data.link || "");
      setStatus(data.status);
      setNotes(data.notes);
      setReminders(data.reminders);
    } catch {
      toast.error("Карточка не найдена");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [cardId, router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes, reminders]);

  // Merge into timeline sorted by creation date
  const timeline: TimelineItem[] = [
    ...notes.map((n) => ({ type: "note" as const, data: n })),
    ...reminders.map((r) => ({ type: "task" as const, data: r })),
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

  const handleAddTask = async () => {
    if (!taskText.trim() || !taskDatetime) return;
    setSendingTask(true);
    try {
      const remindAt = new Date(taskDatetime).toISOString();
      const reminder = await createReminder(cardId, taskText, remindAt);
      setReminders((prev) => [...prev, reminder]);
      setTaskText("");
      setTaskDatetime("");
      setShowTaskForm(false);
      toast.success("Дело добавлено");
    } catch {
      toast.error("Ошибка");
    } finally {
      setSendingTask(false);
    }
  };

  const handleToggleDone = async (reminder: Reminder) => {
    try {
      const updated = await toggleReminderDone(cardId, reminder.id, !reminder.isDone);
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      toast.error("Ошибка");
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
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
      setEditingTitle(false);
      setEditingLink(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить карточку? Все данные будут удалены.")) return;
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
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden animate-pulse">
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 p-5 flex flex-col">
          <div className="h-4 bg-gray-200 rounded w-20 mb-6" />
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
          <div className="flex gap-2 mb-6 mt-6">
            <div className="h-7 bg-gray-200 rounded-full w-16" />
            <div className="h-7 bg-gray-200 rounded-full w-16" />
            <div className="h-7 bg-gray-200 rounded-full w-20" />
          </div>
          <div className="h-20 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-5 space-y-2">
            <div className="h-16 bg-white rounded-lg" />
            <div className="h-12 bg-white rounded-lg" />
            <div className="h-20 bg-amber-50 rounded-lg" />
            <div className="h-14 bg-white rounded-lg" />
          </div>
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const activeTasks = reminders.filter((r) => !r.isDone).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left sidebar */}
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
          <label className="text-xs text-gray-400 uppercase tracking-wide">Клиент</label>
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
            <span>Активных дел</span>
            <span className="font-medium">{activeTasks}</span>
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

      {/* Right side - feed */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {timeline.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Добавьте заметку или дело...</p>
            </div>
          )}

          {timeline.map((item) => {
            if (item.type === "note") {
              const note = item.data;
              return (
                <div
                  key={`note-${note.id}`}
                  className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 group"
                >
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{formatDate(note.createdAt)}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      удалить
                    </button>
                  </div>
                </div>
              );
            } else {
              const task = item.data;
              return (
                <div
                  key={`task-${task.id}`}
                  className={`rounded-lg px-4 py-3 shadow-sm border group flex items-start gap-3 ${
                    task.isDone
                      ? "bg-gray-50 border-gray-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleDone(task)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${
                      task.isDone
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-amber-400 hover:border-amber-500"
                    }`}
                  >
                    {task.isDone && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        task.isDone
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {task.isDone ? "Выполнено" : "Дело"}
                      </span>
                    </div>
                    <p className={`text-sm ${task.isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {task.text}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-400">
                        Срок: {formatDate(task.remindAt)}
                      </span>
                      <button
                        onClick={() => handleDeleteReminder(task.id)}
                        className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                        удалить
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })}
          <div ref={feedEndRef} />
        </div>

        {/* Task form (inline) */}
        <div className={`px-5 py-3 bg-white border-t border-gray-200 ${showTaskForm ? "" : "hidden"}`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="Что нужно сделать?"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
              <input
                type="datetime-local"
                value={taskDatetime}
                onChange={(e) => setTaskDatetime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                size="sm"
                onClick={handleAddTask}
                loading={sendingTask}
                disabled={!taskText.trim() || !taskDatetime}
              >
                Добавить
              </Button>
              <button
                onClick={() => setShowTaskForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
        </div>

        {/* Input bar */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className={`p-2.5 rounded-lg transition flex-shrink-0 ${
                showTaskForm
                  ? "bg-amber-100 text-amber-600"
                  : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
              }`}
              title="Добавить дело"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
