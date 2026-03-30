"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardStatus } from "@/entities/card/model/types";
import { CardItem } from "@/entities/card/ui/CardItem";
import { Badge } from "@/shared/ui";

const statusToBadgeVariant: Record<
  CardStatus,
  "new" | "in_progress" | "done" | "problem"
> = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  PROBLEM: "problem",
};

const statusLabels: Record<CardStatus, string> = {
  NEW: "Новые",
  IN_PROGRESS: "В работе",
  DONE: "Завершённые",
  PROBLEM: "Проблемные",
};

interface KanbanColumnProps {
  status: CardStatus;
  cards: Card[];
  onCardClick: (cardId: string) => void;
}

export function KanbanColumn({
  status,
  cards,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={`w-[80vw] flex-shrink-0 sm:flex-1 sm:min-w-0 bg-gray-50 rounded-xl p-3${
        isOver ? " bg-blue-50 ring-2 ring-blue-200" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={statusToBadgeVariant[status]}>
            {statusLabels[status]}
          </Badge>
          <span className="text-xs text-gray-400">{cards.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="space-y-2 min-h-[calc(100vh-12rem)] overflow-y-auto"
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              Перетащите карточку сюда
            </p>
          )}
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onCardClick={onCardClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
