"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { usePushSubscription } from "@/features/push-notifications/lib/usePushSubscription";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { isSubscribed, permission, subscribe } = usePushSubscription();

  // Poll /api/push/check every 60s to trigger pending reminders locally
  useEffect(() => {
    const check = () => {
      fetch("/api/push/check").catch(() => {});
    };
    check(); // initial check
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-full">
          <h1 className="text-lg font-bold text-gray-800">Mini-CRM</h1>

          <div className="flex items-center gap-3">
            {!isSubscribed && permission !== "denied" && (
              <button
                onClick={subscribe}
                className="text-xs text-blue-600 hover:text-blue-700 transition"
              >
                Включить уведомления
              </button>
            )}

            {session?.user && (
              <>
                <span className="text-sm text-gray-600">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-red-600 transition"
                >
                  Выйти
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
