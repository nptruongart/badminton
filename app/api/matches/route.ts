import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { team1Name, team2Name, score1, score2 } = body;

    const t1Players = team1Name.split(" & ").map((n: string) => n.trim());
    const t2Players = team2Name.split(" & ").map((n: string) => n.trim());
    
    const isT1Win = score1 > score2;
    const isT2Win = score2 > score1;
    const isDraw = score1 === score2;

    const updateStats = async (team: string[], isWinner: boolean, isDrawMatch: boolean) => {
      for (const name of team) {
        if (!name || name.includes("ĐỘI")) continue;
        
        const player = await prisma.player.findFirst({ where: { name } });
        if (player) {
          let eloChange = isDrawMatch ? 0 : (isWinner ? 10 : -5);
          await prisma.player.update({
            where: { id: player.id },
            data: {
              wins: isWinner ? player.wins + 1 : player.wins,
              losses: (!isWinner && !isDrawMatch) ? player.losses + 1 : player.losses,
              elo: player.elo + eloChange
            }
          });
        }
      }
    };

    await updateStats(t1Players, isT1Win, isDraw);
    await updateStats(t2Players, isT2Win, isDraw);

    const newMatch = await prisma.match.create({
      data: { 
        team1: team1Name, 
        team2: team2Name, 
        score1: Number(score1), 
        score2: Number(score2) 
      }
    });

    return NextResponse.json({ success: true, match: newMatch });
  } catch (error) {
    console.error("Lỗi API lưu trận:", error);
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 500 });
  }
}

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

// 🔥 TÍNH NĂNG MỚI: XOÁ SẠCH LỊCH SỬ
export async function DELETE() {
  try {
    await prisma.match.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi xóa lịch sử:", error);
    return NextResponse.json({ success: false, error: "Không thể xóa lịch sử" }, { status: 500 });
  }
}