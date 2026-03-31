import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getAuthSession } from "@/shared/lib/getSession";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telegramId: true },
  });

  return NextResponse.json({ linked: !!user?.telegramId });
}

export async function POST() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = String(Math.floor(100000 + Math.random() * 900000));

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramLinkCode: code },
  });

  return NextResponse.json({ code });
}

export async function DELETE() {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramId: null, telegramLinkCode: null },
  });

  return NextResponse.json({ ok: true });
}
