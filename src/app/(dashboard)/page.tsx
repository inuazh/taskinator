"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/entities/card/model/types";
import { KanbanBoard } from "@/widgets/kanban-board/ui/KanbanBoard";
import { CreateCardModal } from "@/features/create-card/ui/CreateCardModal";

export default function DashboardPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [, setAllCards] = useState<Card[]>([]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleCardsLoaded = useCallback((cards: Card[]) => {
    setAllCards(cards);
  }, []);

  return (
    <div className="h-full">
      <KanbanBoard
        refreshKey={refreshKey}
        onCreateCard={() => setShowCreate(true)}
        onEditCard={(id) => router.push(`/card/${id}`)}
        onCardsLoaded={handleCardsLoaded}
      />

      <CreateCardModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refresh}
      />
    </div>
  );
}
