import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/shared/lib/prisma";

webpush.setVapidDetails(
  "mailto:admin@mini-crm.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret !== "your-cron-secret-here") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const currentHour = now.getUTCHours() + 3; // примерно для UTC+3, подстрой под свой часовой пояс

  // Рабочее время: 9:00 - 21:00
  const isWorkingHours = currentHour >= 9 && currentHour < 21;

  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  // Найти все дела: время пришло, не выполнены, и либо ещё не отправлялись, либо прошло 3+ часа с последней отправки
  const reminders = await prisma.reminder.findMany({
    where: {
      remindAt: { lte: now },
      isDone: false,
      OR: [
        { lastSentAt: null },
        { lastSentAt: { lte: threeHoursAgo } },
      ],
    },
    include: {
      card: {
        include: {
          user: {
            include: {
              pushSubscriptions: true,
            },
          },
        },
      },
    },
  });

  let sent = 0;

  for (const reminder of reminders) {
    // Пропускаем отправку вне рабочего времени (кроме первой отправки)
    if (!isWorkingHours && reminder.isSent) continue;

    const subscriptions = reminder.card.user.pushSubscriptions;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: `Дело: ${reminder.card.title}`,
            body: reminder.text,
            cardId: reminder.cardId,
          })
        );
        sent++;
      } catch (err) {
        console.error("Push error:", err);
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        isSent: true,
        lastSentAt: now,
      },
    });
  }

  return NextResponse.json({
    checked: reminders.length,
    sent,
  });
}
