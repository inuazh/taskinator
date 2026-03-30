"use client";

import { useRouter } from "next/navigation";
// fetch and state are managed by the parent (DashboardClient)

export interface PlanningReminder {
  id: string;
  cardId: string;
  text: string;
  remindAt: string;
  card: { id: string; title: string; status: string };
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Завершена",
  PROBLEM: "Проблема",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  DONE: "bg-green-100 text-green-700",
  PROBLEM: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function overdueLabel(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "просрочено менее дня";
  if (days === 1) return "просрочено 1 день";
  return `просрочено ${days} дней`;
}

interface GroupProps {
  label: string;
  count: number;
  headerColor: string;
  overdue?: boolean;
  items: PlanningReminder[];
  onItemClick: (cardId: string) => void;
}

function Group({ label, count, headerColor, overdue, items, onItemClick }: GroupProps) {
  const overloaded = count > 5;

  return (
    <div className="flex flex-col">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-2 ${headerColor}`}>
        <span className="font-semibold text-sm">{label}</span>
        <span className="text-sm font-bold">{count}</span>
        {overloaded && (
          <span className="ml-auto text-xs font-medium flex items-center gap-1">
            ⚠️ Перегруз
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 px-1 pb-2">Нет задач</p>
      ) : (
        <div className="space-y-2 mb-2">
          {items.map((r) => (
            <div
              key={r.id}
              onClick={() => onItemClick(r.card.id)}
              className="bg-white rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.card.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{r.text}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[r.card.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[r.card.status] ?? r.card.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span>{formatDate(r.remindAt)}</span>
                {overdue && (
                  <span className="text-red-500 font-medium">{overdueLabel(r.remindAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PlanningViewProps {
  reminders: PlanningReminder[];
  loading: boolean;
}

export function PlanningView({ reminders, loading }: PlanningViewProps) {
  const router = useRouter();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrowStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const overdue = reminders.filter((r) => new Date(r.remindAt) < todayStart);
  const today = reminders.filter((r) => {
    const d = new Date(r.remindAt);
    return d >= todayStart && d < tomorrowStart;
  });
  const tomorrow = reminders.filter((r) => {
    const d = new Date(r.remindAt);
    return d >= tomorrowStart && d < dayAfterTomorrow;
  });
  const week = reminders.filter((r) => {
    const d = new Date(r.remindAt);
    return d >= dayAfterTomorrow && d <= weekEnd;
  });

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-5 animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-9 bg-gray-200 rounded-lg mb-2" />
            <div className="space-y-2">
              <div className="h-16 bg-white rounded-lg border border-gray-100" />
              <div className="h-16 bg-white rounded-lg border border-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto space-y-4">
        <Group
          label="Просроченные"
          count={overdue.length}
          headerColor="bg-red-50 text-red-700"
          overdue
          items={overdue}
          onItemClick={(id) => router.push(`/card/${id}`)}
        />
        <Group
          label="Сегодня"
          count={today.length}
          headerColor="bg-blue-50 text-blue-700"
          items={today}
          onItemClick={(id) => router.push(`/card/${id}`)}
        />
        <Group
          label="Завтра"
          count={tomorrow.length}
          headerColor="bg-yellow-50 text-yellow-700"
          items={tomorrow}
          onItemClick={(id) => router.push(`/card/${id}`)}
        />
        <Group
          label="Ближайшие 7 дней"
          count={week.length}
          headerColor="bg-green-50 text-green-700"
          items={week}
          onItemClick={(id) => router.push(`/card/${id}`)}
        />
      </div>
    </div>
  );
}
