import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const players = await prisma.player.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json({ success: true, players });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi tải dữ liệu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, id } = body;

    if (action === "add") {
      const newPlayer = await prisma.player.create({ data: { name } });
      return NextResponse.json({ success: true, player: newPlayer });
    }

    if (action === "delete") {
      await prisma.player.delete({ where: { id: Number(id) } });
      return NextResponse.json({ success: true });
    }

    // TÍNH NĂNG XOÁ HẾT TẤT CẢ THÀNH VIÊN
    if (action === "deleteAll") {
      await prisma.player.deleteMany({});
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Action không hợp lệ" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi xử lý" }, { status: 500 });
  }
}