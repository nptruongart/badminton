import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { team1Name, team2Name, score1, score2 } = body;

    // 1. Tách tên người chơi từ chuỗi (VD: "Phi & Qa" -> ["Phi", "Qa"])
    const t1Players = team1Name.split(" & ").map((n: string) => n.trim());
    const t2Players = team2Name.split(" & ").map((n: string) => n.trim());
    
    const isT1Win = score1 > score2;
    const isT2Win = score2 > score1;
    const isDraw = score1 === score2;

    // 2. Hàm Cập nhật Elo, Thắng/Thua cho từng tay vợt
    const updateStats = async (team: string[], isWinner: boolean, isDrawMatch: boolean) => {
      for (const name of team) {
        if (!name || name.includes("ĐỘI")) continue; // Bỏ qua tên mặc định
        
        const player = await prisma.player.findFirst({ where: { name } });
        if (player) {
          // Luật Elo: Thắng +10, Thua -5, Hòa +0
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

    // Chạy cập nhật cho cả 2 đội
    await updateStats(t1Players, isT1Win, isDraw);
    await updateStats(t2Players, isT2Win, isDraw);

    // 3. Lưu lịch sử trận đấu vào Database
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
    // Lấy danh sách lịch sử các trận đấu
    const matches = await prisma.match.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });
    return NextResponse.json({ success: true, matches });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi tải lịch sử" }, { status: 500 });
  }
}