import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  segmentData: { params: Params }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await segmentData.params;

  const card = await prisma.card.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!card) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  const notes = await prisma.note.findMany({
    where: { cardId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(
  request: Request,
  segmentData: { params: Params }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await segmentData.params;
  const { text } = await request.json();

  const card = await prisma.card.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!card) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Текст обязателен" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: { cardId: id, text: text.trim() },
  });

  return NextResponse.json(note, { status: 201 });
}
