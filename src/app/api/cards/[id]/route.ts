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
    include: { notes: true, reminders: true },
  });

  if (!card) {
    return NextResponse.json(
      { error: "Карточка не найдена" },
      { status: 404 }
    );
  }

  return NextResponse.json(card);
}

export async function PATCH(
  request: Request,
  segmentData: { params: Params }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await segmentData.params;
  const body = await request.json();

  const card = await prisma.card.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!card) {
    return NextResponse.json(
      { error: "Карточка не найдена" },
      { status: 404 }
    );
  }

  const updated = await prisma.card.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.link !== undefined && { link: body.link }),
      ...(body.status !== undefined && { status: body.status }),
    },
    include: { notes: true, reminders: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
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
    return NextResponse.json(
      { error: "Карточка не найдена" },
      { status: 404 }
    );
  }

  await prisma.card.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
