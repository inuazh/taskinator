import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { cards } = await request.json();

  if (!Array.isArray(cards)) {
    return NextResponse.json(
      { error: "Неверный формат данных" },
      { status: 400 }
    );
  }

  const cardIds = cards.map((c: { id: string }) => c.id);
  const existingCards = await prisma.card.findMany({
    where: { id: { in: cardIds }, userId: session.user.id },
    select: { id: true },
  });

  if (existingCards.length !== cardIds.length) {
    return NextResponse.json(
      { error: "Некоторые карточки не найдены" },
      { status: 403 }
    );
  }

  await Promise.all(
    cards.map((c: { id: string; status: string; order: number }) =>
      prisma.card.update({
        where: { id: c.id },
        data: {
          status: c.status as "NEW" | "IN_PROGRESS" | "DONE" | "PROBLEM",
          order: c.order,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
