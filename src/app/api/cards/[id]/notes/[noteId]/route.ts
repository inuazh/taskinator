import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";

type Params = Promise<{ id: string; noteId: string }>;

export async function DELETE(
  _request: Request,
  segmentData: { params: Params }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id, noteId } = await segmentData.params;

  const card = await prisma.card.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!card) {
    return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: noteId } });

  return NextResponse.json({ success: true });
}
