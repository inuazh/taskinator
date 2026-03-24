"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/entities/card/model/types";
import { KanbanBoard } from "@/widgets/kanban-board/ui/KanbanBoard";
import { CreateCardModal } from "@/features/create-card/ui/CreateCardModal";

interface DashboardClientProps {
  initialCards: Card[];
}

export function DashboardClient({ initialCards }: DashboardClientProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="h-full">
      <KanbanBoard
        initialCards={initialCards}
        refreshKey={refreshKey}
        onCreateCard={() => setShowCreate(true)}
        onEditCard={(id) => router.push(`/card/${id}`)}
      />

      <CreateCardModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refresh}
      />
    </div>
  );
}
