import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lấy danh sách thành viên và Elo từ Database
export async function GET() {
  try {
    let players = await prisma.player.findMany();
    // Nếu database trống, tạo sẵn mặc định 6 anh em
    if (players.length === 0) {
      const defaultNames = ["Lien", "Cuong", "Fi", "Ton", "QA", "aDean"];
      for (const name of defaultNames) {
        await prisma.player.create({ data: { name, elo: 1000, wins: 0, losses: 0 } });
      }
      players = await prisma.player.findMany();
    }
    return NextResponse.json({ success: true, players });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi tải dữ liệu" }, { status: 500 });
  }
}

// Cập nhật lại Elo và Thắng/Thua sau trận đấu hoặc Thêm/Xóa người
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, players: updatedPlayers, nameToRemove, newName } = body;

    if (action === "update_all") {
      // Cập nhật hàng loạt (khi có kết quả trận đấu)
      for (const p of updatedPlayers) {
        await prisma.player.upsert({
          where: { name: p.name },
          update: { elo: p.elo, wins: p.wins, losses: p.losses },
          create: { name: p.name, elo: p.elo, wins: p.wins, losses: p.losses },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "add") {
      const existing = await prisma.player.findUnique({ where: { name: newName } });
      if (!existing) {
        await prisma.player.create({ data: { name: newName, elo: 1000, wins: 0, losses: 0 } });
      }
      const players = await prisma.player.findMany();
      return NextResponse.json({ success: true, players });
    }

    if (action === "remove") {
      await prisma.player.delete({ where: { name: nameToRemove } }).catch(() => {});
      const players = await prisma.player.findMany();
      return NextResponse.json({ success: true, players });
    }

    return NextResponse.json({ success: false, error: "Action không hợp lệ" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi hệ thống" }, { status: 500 });
  }
}