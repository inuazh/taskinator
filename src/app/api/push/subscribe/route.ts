import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { endpoint, p256dh, auth } = await request.json();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Неверные данные подписки" },
      { status: 400 }
    );
  }

  const existing = await prisma.pushSubscription.findFirst({
    where: { userId: session.user.id, endpoint },
  });

  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: { p256dh, auth },
    });
  } else {
    await prisma.pushSubscription.create({
      data: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
      },
    });
  }

  return NextResponse.json({ success: true });
}
