import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: object
) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
}

export async function POST(request: Request) {
  // Verify webhook secret
  if (WEBHOOK_SECRET) {
    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const update = await request.json();
  const message = update.message;

  if (!message?.text || !message.from) {
    return NextResponse.json({ ok: true });
  }

  const chatId: number = message.chat.id;
  const text: string = message.text.trim();

  if (text === "/start") {
    await sendMessage(
      chatId,
      "👋 Привет! Я бот Taskinator.\n\nЧтобы получать уведомления о делах прямо в Telegram, привяжи свой аккаунт:\n\n1. Открой приложение\n2. Нажми «Привязать Telegram» в шапке\n3. Скопируй код и отправь мне: <code>/link XXXXXX</code>",
      {
        inline_keyboard: [
          [{ text: "🚀 Открыть приложение", url: "https://taskinator-seven.vercel.app" }],
        ],
      }
    );
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/link ")) {
    const code = text.slice(6).trim();

    const user = await prisma.user.findUnique({
      where: { telegramLinkCode: code },
    });

    if (!user) {
      await sendMessage(chatId, "❌ Код не найден или устарел. Сгенерируй новый в приложении.");
      return NextResponse.json({ ok: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramId: BigInt(message.from.id),
        telegramLinkCode: null,
      },
    });

    await sendMessage(chatId, "✅ Аккаунт привязан! Теперь уведомления о делах будут приходить сюда.");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
