import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/shared/lib/prisma";

webpush.setVapidDetails(
  "mailto:admin@mini-crm.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
  // In production, verify cron secret. In dev, allow without auth.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret !== "your-cron-secret-here") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  const reminders = await prisma.reminder.findMany({
    where: {
      remindAt: { lte: now },
      isSent: false,
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
            title: "Напоминание",
            body: reminder.text,
            cardId: reminder.cardId,
          })
        );
        sent++;
      } catch (err) {
        console.error("Push error:", err);
        // Remove invalid subscription
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
      data: { isSent: true },
    });
  }

  return NextResponse.json({
    checked: reminders.length,
    sent,
  });
}
