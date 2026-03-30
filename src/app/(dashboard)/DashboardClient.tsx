"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/entities/card/model/types";
import { KanbanBoard } from "@/widgets/kanban-board/ui/KanbanBoard";
import { PlanningView } from "@/widgets/planning-view/ui/PlanningView";
import { CreateCardModal } from "@/features/create-card/ui/CreateCardModal";

interface DashboardClientProps {
  initialCards: Card[];
}

type View = "kanban" | "planning";

export function DashboardClient({ initialCards }: DashboardClientProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<View>("kanban");

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 57px)" }}>
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex flex-shrink-0">
        <TabButton active={view === "kanban"} onClick={() => setView("kanban")}>
          Канбан
        </TabButton>
        <TabButton active={view === "planning"} onClick={() => setView("planning")}>
          Планирование
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {view === "kanban" ? (
          <KanbanBoard
            initialCards={initialCards}
            refreshKey={refreshKey}
            onCreateCard={() => setShowCreate(true)}
            onEditCard={(id) => router.push(`/card/${id}`)}
          />
        ) : (
          <PlanningView />
        )}
      </div>

      <CreateCardModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refresh}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
