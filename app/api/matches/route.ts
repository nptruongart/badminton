import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, matches });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi tải lịch sử" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamAName, teamBName, scoreA, scoreB } = body;

    // 1. Lưu trận đấu vào bảng Match (Lịch sử)
    const newMatch = await prisma.match.create({
      data: { teamAName, teamBName, scoreA: Number(scoreA), scoreB: Number(scoreB) },
    });

    // 2. TỰ ĐỘNG CẬP NHẬT ELO & WIN/LOSS VÀO DATABASE CHO BẢNG GHÉP KÈO
    const sA = Number(scoreA);
    const sB = Number(scoreB);

    if (sA !== sB) {
      const winningTeamStr = sA > sB ? teamAName : teamBName;
      const losingTeamStr = sA > sB ? teamBName : teamAName;

      // Tách tên thành viên (hỗ trợ cả dấu "&" hoặc dấu cách nếu có)
      const winningMembers = winningTeamStr.split(/&|,/).map((n: string) => n.trim());
      const losingMembers = losingTeamStr.split(/&|,/).map((n: string) => n.trim());

      // Cộng điểm cho đội thắng
      for (const name of winningMembers) {
        const player = await prisma.player.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } }
        });
        if (player) {
          await prisma.player.update({
            where: { id: player.id },
            data: { elo: player.elo + 15, wins: player.wins + 1 }
          });
        }
      }

      // Trừ điểm cho đội thua
      for (const name of losingMembers) {
        const player = await prisma.player.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } }
        });
        if (player) {
          await prisma.player.update({
            where: { id: player.id },
            data: { elo: Math.max(500, player.elo - 15), losses: player.losses + 1 }
          });
        }
      }
    }

    return NextResponse.json({ success: true, match: newMatch });
  } catch (error) {
    console.error("Lỗi API match:", error);
    return NextResponse.json({ success: false, error: "Lỗi hệ thống" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.match.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi xóa lịch sử" }, { status: 500 });
  }
}