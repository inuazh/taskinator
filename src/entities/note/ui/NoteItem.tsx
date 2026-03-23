"use client";

import { Note } from "../model/types";

interface NoteItemProps {
  note: Note;
  onDelete: (noteId: string) => void;
}

export function NoteItem({ note, onDelete }: NoteItemProps) {
  return (
    <div className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(note.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <button
        onClick={() => onDelete(note.id)}
        className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
