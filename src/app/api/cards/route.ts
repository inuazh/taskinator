import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";
import { CardStatus } from "@/generated/prisma/client";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

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

  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { title, link, status } = await request.json();

  if (!title || !title.trim()) {
    return NextResponse.json(
      { error: "Название обязательно" },
      { status: 400 }
    );
  }

  const cardStatus: CardStatus = status || "NEW";

  const maxOrder = await prisma.card.aggregate({
    where: { userId: session.user.id, status: cardStatus },
    _max: { order: true },
  });

  const card = await prisma.card.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      link: link || null,
      status: cardStatus,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: {
      _count: { select: { notes: true, reminders: true } },
      reminders: {
        where: { isDone: false },
        orderBy: { remindAt: "asc" },
        take: 1,
        select: { remindAt: true },
      },
    },
  });

  return NextResponse.json(card, { status: 201 });
}
