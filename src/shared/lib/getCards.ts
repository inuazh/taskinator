import { prisma } from "./prisma";
import { getAuthSession } from "./getSession";
import { Card } from "@/entities/card/model/types";

export async function getCardsServer(): Promise<Card[]> {
  const session = await getAuthSession();
  if (!session) return [];

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { notes: true, reminders: true } },
      reminders: {
        where: { isDone: false },
        orderBy: { remindAt: "asc" },
        take: 1,
        select: { remindAt: true },
      },
    },
    orderBy: { order: "asc" },
  });

  // Serialize dates to strings for client components
  return JSON.parse(JSON.stringify(cards));
}
