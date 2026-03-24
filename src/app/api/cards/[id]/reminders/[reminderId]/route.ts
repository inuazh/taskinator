import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";

type Params = Promise<{ id: string; reminderId: string }>;

export async function DELETE(
  _request: Request,
  segmentData: { params: Params }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id, reminderId } = await segmentData.params;

  const card = await prisma.card.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!card) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  await prisma.reminder.delete({ where: { id: reminderId } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  segmentData: { params: Params }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id, reminderId } = await segmentData.params;
  const body = await request.json();

  const card = await prisma.card.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!card) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    data: { isDone: body.isDone },
  });

  return NextResponse.json(reminder);
}
