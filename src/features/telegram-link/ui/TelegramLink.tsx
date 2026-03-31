"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function TelegramLink() {
  const { data: session } = useSession();
  const [linked, setLinked] = useState<boolean | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/telegram/link")
      .then((r) => r.json())
      .then((data) => setLinked(data.linked))
      .catch(() => {});
  }, [session]);

  if (!session?.user || linked === null) return null;

  if (linked) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600">Telegram ✓</span>
        <button
          onClick={async () => {
            await fetch("/api/telegram/link", { method: "DELETE" });
            setLinked(false);
          }}
          className="text-xs text-gray-400 hover:text-red-500 transition"
        >
          Отвязать
        </button>
      </div>
    );
  }

  if (code) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">
          Отправь боту:{" "}
          <code className="bg-gray-100 px-1 rounded font-mono">/link {code}</code>
        </span>
        <button
          onClick={() => setCode(null)}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/telegram/link", { method: "POST" });
          const data = await res.json();
          setCode(data.code);
        } finally {
          setLoading(false);
        }
      }}
      className="text-xs text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
    >
      Привязать Telegram
    </button>
  );
}
