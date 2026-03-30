import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const reminders = await prisma.reminder.findMany({
    where: {
      isDone: false,
      remindAt: { lte: sevenDaysLater },
      card: { userId: session.user.id },
    },
    include: {
      card: {
        select: { id: true, title: true, status: true },
      },
    },
    orderBy: { remindAt: "asc" },
  });

  return NextResponse.json(JSON.parse(JSON.stringify(reminders)));
}
