import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tienSan, soCau, giaCau, soNguoi, tongTien, chiaDeu } = body;

    const newExpense = await prisma.expense.create({
      data: { 
        tienSan: Number(tienSan), 
        soCau: Number(soCau), 
        giaCau: Number(giaCau), 
        soNguoi: Number(soNguoi), 
        tongTien: Number(tongTien), 
        chiaDeu: Number(chiaDeu) 
      },
    });

    return NextResponse.json({ success: true, expense: newExpense });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi hệ thống" }, { status: 500 });
  }
}