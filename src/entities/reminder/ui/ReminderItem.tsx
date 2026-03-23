"use client";

import { Reminder } from "../model/types";

interface ReminderItemProps {
  reminder: Reminder;
  onDelete: (reminderId: string) => void;
}

export function ReminderItem({ reminder, onDelete }: ReminderItemProps) {
  const isPast = new Date(reminder.remindAt) < new Date();

  return (
    <div className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{reminder.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className={`text-xs ${isPast ? "text-red-500" : "text-gray-400"}`}>
            {new Date(reminder.remindAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {reminder.isSent && (
            <span className="text-xs text-green-500 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Отправлено
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(reminder.id)}
        className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
