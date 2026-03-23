"use client";

import { useState, useCallback } from "react";
import { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Card, CardStatus } from "@/entities/card/model/types";
import { reorderCards } from "@/entities/card/api/cardApi";

const STATUSES: CardStatus[] = ["NEW", "IN_PROGRESS", "DONE", "PROBLEM"];

export function useDragCard(initialCards: Card[]) {
  const [cards, setCards] = useState<Card[]>(initialCards);

  const getCardsByStatus = useCallback(
    (status: CardStatus) =>
      cards
        .filter((c) => c.status === status)
        .sort((a, b) => a.order - b.order),
    [cards]
  );

  const findCardStatus = useCallback(
    (cardId: string): CardStatus | undefined => {
      const card = cards.find((c) => c.id === cardId);
      return card?.status;
    },
    [cards]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeStatus = findCardStatus(activeId);
      const overStatus = findCardStatus(overId) || (STATUSES.includes(overId as CardStatus) ? (overId as CardStatus) : undefined);

      if (!activeStatus || !overStatus) return;
      if (activeStatus === overStatus) return;

      setCards((prev) => {
        return prev.map((c) =>
          c.id === activeId ? { ...c, status: overStatus } : c
        );
      });
    },
    [findCardStatus]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      setCards((prev) => {
        const activeCard = prev.find((c) => c.id === activeId);
        if (!activeCard) return prev;

        const status = activeCard.status;
        const columnCards = prev
          .filter((c) => c.status === status)
          .sort((a, b) => a.order - b.order);

        const oldIndex = columnCards.findIndex((c) => c.id === activeId);
        const newIndex = columnCards.findIndex((c) => c.id === overId);

        let reordered: Card[];
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reordered = arrayMove(columnCards, oldIndex, newIndex);
        } else {
          reordered = columnCards;
        }

        const updatedColumn = reordered.map((c, i) => ({
          ...c,
          order: i,
        }));

        const newCards = prev.map((c) => {
          const updated = updatedColumn.find((u) => u.id === c.id);
          return updated || c;
        });

        // Send to server
        const toSync = updatedColumn.map((c) => ({
          id: c.id,
          status: c.status,
          order: c.order,
        }));
        reorderCards(toSync).catch(console.error);

        return newCards;
      });
    },
    []
  );

  return {
    cards,
    setCards,
    getCardsByStatus,
    handleDragOver,
    handleDragEnd,
  };
}
