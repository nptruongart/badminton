import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { id: 'desc' } });
    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi tải dữ liệu thu chi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, payer, amount, id } = body;

    if (action === "add") {
      const newExp = await prisma.expense.create({
        data: { name, payer, amount: Number(amount) }
      });
      return NextResponse.json({ success: true, expense: newExp });
    }

    if (action === "delete") {
      await prisma.expense.delete({ where: { id: Number(id) } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Action không hợp lệ" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi xử lý thu chi" }, { status: 500 });
  }
}