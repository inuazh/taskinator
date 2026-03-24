"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CardStatus, Card } from "@/entities/card/model/types";
import { getCards } from "@/entities/card/api/cardApi";
import { useDragCard } from "@/features/drag-card/lib/useDragCard";
import { KanbanColumn } from "@/widgets/kanban-column/ui/KanbanColumn";
import { CardItem } from "@/entities/card/ui/CardItem";
import { Badge } from "@/shared/ui";

const STATUSES: CardStatus[] = ["NEW", "IN_PROGRESS", "DONE", "PROBLEM"];

const statusToBadgeVariant: Record<CardStatus, "new" | "in_progress" | "done" | "problem"> = {
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

interface KanbanBoardProps {
  initialCards?: Card[];
  onCreateCard: () => void;
  onEditCard: (cardId: string) => void;
  refreshKey: number;
}

// Static board for SSR — no dnd hooks, no hydration mismatch
function StaticBoard({ cards, onEditCard }: { cards: Card[]; onEditCard: (id: string) => void }) {
  const getByStatus = (status: CardStatus) =>
    cards.filter((c) => c.status === status).sort((a, b) => a.order - b.order);

  return (
    <div className="flex gap-3 p-4 h-[calc(100vh-4rem)]">
      {STATUSES.map((status) => {
        const statusCards = getByStatus(status);
        return (
          <div key={status} className="flex-1 min-w-0 bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant={statusToBadgeVariant[status]}>
                  {statusLabels[status]}
                </Badge>
                <span className="text-xs text-gray-400">{statusCards.length}</span>
              </div>
            </div>
            <div className="space-y-2 min-h-[calc(100vh-12rem)]">
              {statusCards.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">
                  Перетащите карточку сюда
                </p>
              )}
              {statusCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => onEditCard(card.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-800 text-sm">{card.title}</h3>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    {card._count.notes > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {card._count.notes}
                      </span>
                    )}
                    {card.reminders?.[0] && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(card.reminders[0].remindAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function KanbanBoard({
  initialCards,
  onCreateCard,
  onEditCard,
  refreshKey,
}: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const { cards, setCards, getCardsByStatus, handleDragOver, handleDragEnd } =
    useDragCard(initialCards || []);

  const isFirstRender = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadCards = useCallback(async () => {
    try {
      const data = await getCards();
      setCards(data);
    } catch (err) {
      console.error("Ошибка загрузки карточек:", err);
    }
  }, [setCards]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!initialCards?.length) {
        loadCards();
      }
      return;
    }
    loadCards();
  }, [loadCards, refreshKey]);

  const addButton = (
    <button
      onClick={onCreateCard}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition hover:scale-105 z-50"
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );

  // Before hydration: render static board without dnd hooks
  if (!mounted) {
    return (
      <>
        <StaticBoard cards={cards} onEditCard={onEditCard} />
        {addButton}
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => {
        const card = cards.find((c) => c.id === event.active.id);
        setActiveCard(card || null);
      }}
      onDragOver={handleDragOver}
      onDragEnd={(event) => {
        handleDragEnd(event);
        setActiveCard(null);
      }}
      onDragCancel={() => setActiveCard(null)}
    >
      <div className="flex gap-3 p-4 h-[calc(100vh-4rem)]">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            cards={getCardsByStatus(status)}
            onCardClick={onEditCard}
          />
        ))}
      </div>

      {addButton}

      <DragOverlay>
        {activeCard ? (
          <CardItem card={activeCard} onCardClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
