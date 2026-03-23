"use client";

import { useEffect, useState, useCallback } from "react";
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

const STATUSES: CardStatus[] = ["NEW", "IN_PROGRESS", "DONE", "PROBLEM"];

interface KanbanBoardProps {
  onCreateCard: () => void;
  onEditCard: (cardId: string) => void;
  refreshKey: number;
  onCardsLoaded?: (cards: Card[]) => void;
}

export function KanbanBoard({
  onCreateCard,
  onEditCard,
  refreshKey,
  onCardsLoaded,
}: KanbanBoardProps) {
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const { cards, setCards, getCardsByStatus, handleDragOver, handleDragEnd } =
    useDragCard([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadCards = useCallback(async () => {
    try {
      const data = await getCards();
      setCards(data);
      onCardsLoaded?.(data);
    } catch (err) {
      console.error("Ошибка загрузки карточек:", err);
    } finally {
      setLoading(false);
    }
  }, [setCards, onCardsLoaded]);

  useEffect(() => {
    loadCards();
  }, [loadCards, refreshKey]);

  if (loading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {STATUSES.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-72 bg-gray-50 rounded-xl p-3 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-24 mb-3" />
            <div className="space-y-2">
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
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
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-8rem)]">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            cards={getCardsByStatus(status)}
            onCardClick={onEditCard}
          />
        ))}

        <button
          onClick={onCreateCard}
          className="flex-shrink-0 w-72 min-h-[100px] border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <DragOverlay>
        {activeCard ? (
          <CardItem card={activeCard} onCardClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
