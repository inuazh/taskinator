"use client";

import { useState, useCallback } from "react";
import { Card } from "@/entities/card/model/types";
import { KanbanBoard } from "@/widgets/kanban-board/ui/KanbanBoard";
import { CreateCardModal } from "@/features/create-card/ui/CreateCardModal";
import { EditCardModal } from "@/features/edit-card/ui/EditCardModal";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [allCards, setAllCards] = useState<Card[]>([]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleCardsLoaded = useCallback((cards: Card[]) => {
    setAllCards(cards);
  }, []);

  return (
    <div className="h-full">
      <KanbanBoard
        refreshKey={refreshKey}
        onCreateCard={() => setShowCreate(true)}
        onEditCard={(id) => setEditCardId(id)}
        onCardsLoaded={handleCardsLoaded}
      />

      <CreateCardModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refresh}
      />

      {editCardId && (
        <EditCardModal
          cardId={editCardId}
          cards={allCards}
          onClose={() => setEditCardId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}
